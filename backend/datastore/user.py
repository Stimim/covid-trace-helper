import logging
import os
import requests

from flask import request
from google.cloud import datastore as datastore_module
from jose import jwt

import config as config_module
from datastore import datastore_helper


_KEYS = None
_AUDIENCE = None

def _Keys():
  global _KEYS

  if _KEYS is None:
    resp = requests.get('https://www.gstatic.com/iap/verify/public_key')
    _KEYS = resp.json()
  return _KEYS

def _Audience():
  global _AUDIENCE

  if _AUDIENCE is None:
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT', None)

    endpoint = 'http://metadata.google.internal'
    path = '/computeMetadata/v1/project/numeric-project-id'
    response = requests.get(
        '{}/{}'.format(endpoint, path),
        headers = {'Metadata-Flavor': 'Google'}
    )
    project_number = response.json()

    _AUDIENCE = '/projects/{}/apps/{}'.format(project_number, project_id)

  return _AUDIENCE


class User:
  DATASTORE_KEY = 'User'

  __slots__ = [
    'email',
    'id',
    'can_upload_photo',
    'can_delete_photo',
  ]

  def __init__(self, email, id, can_upload_photo=True, can_delete_photo=False):
    self.email = email
    self.id = id
    self.can_upload_photo = can_upload_photo
    self.can_delete_photo = can_delete_photo

  def ToDict(self):
    return {
      'email': self.email,
      'id': self.id,
      'can_upload_photo': self.can_upload_photo,
      'can_delete_photo': self.can_delete_photo,
    }

  @classmethod
  def Query(cls, user_id):
    client = datastore_helper.Client()
    query = client.query(kind=cls.DATASTORE_KEY)
    query.add_filter('id', '=', user_id)
    results = list(query.fetch())
    if len(results) > 0:
      return cls(**results[0])
    return None

  @classmethod
  def Create(cls, email, user_id):
    user = cls(email, user_id)
    client = datastore_helper.Client()
    entity = datastore_module.Entity(client.key(cls.DATASTORE_KEY))
    entity.update(user.ToDict())
    client.put(entity)
    return user

  @classmethod
  def GetUser(cls):
    assertion = request.headers.get('X-Goog-IAP-JWT-Assertion')
    if assertion is None:
      return None

    info = jwt.decode(
      assertion,
      _Keys(),
      algorithms=['ES256'],
      audience=_Audience()
    )

    email = info['email']
    user_id = info['sub']

    user = cls.Query(user_id)
    if user:
      return user
    return cls.Create(email, user_id)
