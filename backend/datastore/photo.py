import hashlib
import json
import os
import typing

from google.cloud import storage as storage_module
from google.cloud import datastore as datastore_module

import config as config_module
from datastore import datastore_helper


MIMETYPE_TO_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
}


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
    'text_data_key',
  ]

  def __init__(self, checksum, mimetype, date, source, region, uploaded_by,
               text_data_key):
    self.checksum = checksum
    self.mimetype = mimetype
    self.date = date
    self.source = source
    self.region = region
    self.uploaded_by = uploaded_by
    self.text_data_key = text_data_key

  def ToDict(self):
    return {
      'checksum': self.checksum,
      'mimetype': self.mimetype,
      'date': self.date,
      'source': self.source,
      'region': self.region,
      'uploaded_by': self.uploaded_by,
      'text_data_key': self.text_data_key,
    }

  def __repr__(self):
    return json.dumps(self.ToDict())

  @classmethod
  def Create(cls, file, date, region, source, uploaded_by):

    if file.mimetype not in MIMETYPE_TO_EXT:
      raise Exception(f'File type {file.mimetype} is not allowed')

    data = file.stream.read()
    checksum = hashlib.sha256(data).digest().hex()
    filename = f'{checksum}.{MIMETYPE_TO_EXT[file.mimetype]}'

    storage_client = storage_module.Client()
    bucket = storage_client.bucket(config_module.STORAGE_BUCKET_ID)
    blob = bucket.blob(os.path.join(config_module.STORAGE_ROOT_FOLDER,
                                    filename))
    if blob.exists():
      raise Exception(f'Photo {filename} already exists')
    blob.upload_from_string(data, content_type=file.mimetype)

    photo = cls(checksum, file.mimetype, date, source, region, uploaded_by,
                None)

    store_client = datastore_helper.Client()
    entity = datastore_module.Entity(store_client.key(cls.DATASTORE_KEY))
    entity.update(photo.ToDict())
    store_client.put(entity)

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
      results.append(cls(**result))
    return results
