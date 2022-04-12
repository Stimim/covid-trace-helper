import hashlib
import json
import os
import typing

from google.appengine.ext import deferred
from google.cloud import storage as storage_module
from google.cloud import datastore as datastore_module

import config as config_module
from datastore import datastore_helper
from vision import ocr


MIMETYPE_TO_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
}


_GS_URI_TEMPLATE = 'gs://{bucket_id}/{root_folder}/{checksum}'


class Photo:
  DATASTORE_KEY = 'Photo'

  __slots__ = [
    'checksum',
    'mimetype',
    'date',  # The release date of the image. It's a string in yyyy-mm-dd
             # format.
    'source',  # The source of the image.
    'region',
    'uploaded_by',

    '__entity',
  ]

  def __init__(self, checksum, mimetype, date, source, region, uploaded_by):
    self.checksum = checksum
    self.mimetype = mimetype
    self.date = date
    self.source = source
    self.region = region
    self.uploaded_by = uploaded_by

  def ToDict(self):
    return {
      'checksum': self.checksum,
      'mimetype': self.mimetype,
      'date': self.date,
      'source': self.source,
      'region': self.region,
      'uploaded_by': self.uploaded_by,
    }

  def GetStorageUrl(self) -> str:
    return _GS_URI_TEMPLATE.format(
      bucket_id=config_module.STORAGE_BUCKET_ID,
      root_folder=config_module.STORAGE_ROOT_FOLDER,
      checksum=self.checksum)

  def __repr__(self):
    return json.dumps(self.ToDict())

  def UpdateEntity(self, d):
    self.__entity.update(d)

  @classmethod
  def Create(cls, file, date, region, source, uploaded_by):

    if file.mimetype not in MIMETYPE_TO_EXT:
      raise Exception(f'File type {file.mimetype} is not allowed')

    data = file.stream.read()
    checksum = hashlib.sha256(data).digest().hex()
    filename = checksum

    storage_client = storage_module.Client()
    bucket = storage_client.bucket(config_module.STORAGE_BUCKET_ID)
    blob = bucket.blob(os.path.join(config_module.STORAGE_ROOT_FOLDER,
                                    filename))
    if blob.exists():
      raise Exception(f'Photo {filename} already exists')
    blob.upload_from_string(data, content_type=file.mimetype)

    photo = cls(checksum, file.mimetype, date, source, region, uploaded_by)

    store_client = datastore_helper.Client()
    entity = datastore_module.Entity(store_client.key(cls.DATASTORE_KEY))
    entity.update(photo.ToDict())
    store_client.put(entity)

    deferred.defer(ocr.DetectTextTask, photo.checksum)

    return photo

  @classmethod
  def Query(cls, date, region) -> typing.List['Photo']:
    client = datastore_helper.Client()

    query = client.query(kind=cls.DATASTORE_KEY)
    query.add_filter('date', '=', date)
    if region:
      query.add_filter('region', '=', region)

    results = []
    for result in query.fetch():
      o = cls(**result)
      o.__entity = result
      results.append(o)
    return results

  @classmethod
  def QueryByChecksum(cls, checksum: str) -> 'Photo':
    client = datastore_helper.Client()

    query = client.query(kind=cls.DATASTORE_KEY)
    query.add_filter('checksum', '=', checksum)
    results = list(query.fetch())
    if len(results) >= 0:
      o = cls(**results[0])
      o.__entity = results[0]
      return o
    raise ValueError(f'No such photo (checksum={checksum})')

