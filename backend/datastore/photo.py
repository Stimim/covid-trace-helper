import hashlib
import json
import typing

from google.cloud import storage as storage_module
from google.cloud import datastore as datastore_module


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
    'text_data_key',
  ]

  def __init__(self, checksum, mimetype, date, source, region, text_data_key):
    self.checksum = checksum
    self.mimetype = mimetype
    self.date = date
    self.source = source
    self.region = region
    self.text_data_key = text_data_key

  def ToDict(self):
    return {
      'checksum': self.checksum,
      'mimetype': self.mimetype,
      'date': self.date,
      'source': self.source,
      'region': self.region,
      'text_data_key': self.text_data_key,
    }

  def __repr__(self):
    return json.dumps(self.ToDict())

  @classmethod
  def Save(cls, file, date, region, source):

    if file.mimetype not in MIMETYPE_TO_EXT:
      raise Exception(f'File type {file.mimetype} is not allowed')

    data = file.stream.read()
    checksum = hashlib.sha256(data).digest().hex()
    filename = f'{checksum}.{MIMETYPE_TO_EXT[file.mimetype]}'

    storage_client = storage_module.Client()
    bucket = storage_client.bucket('taiwan-covid-trace-helper.appspot.com')
    blob = bucket.blob(filename)
    if blob.exists():
      raise Exception(f'Photo {filename} already exists')
    blob.upload_from_string(data, content_type=file.mimetype)

    photo = cls(checksum, file.mimetype, date, source, region, None)

    store_client = datastore_module.Client()
    entity = datastore_module.Entity(store_client.key(cls.DATASTORE_KEY))
    entity.update(photo.ToDict())
    store_client.put(entity)

    return photo

  @classmethod
  def Query(cls, date, region) -> typing.List['Photo']:
    client = datastore_module.Client();

    query = client.query(kind=cls.DATASTORE_KEY)
    query.add_filter("date", "=", date)
    if region:
      query.add_filter("region", "=", region)

    results = []
    for result in query.fetch():
      results.append(cls(**result))
    return results
