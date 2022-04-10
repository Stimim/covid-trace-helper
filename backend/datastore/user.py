import logging
import os
import requests

from flask import request
from jose import jwt


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
  __slots__ = [
    'email',
    'id'
  ]

  def __init__(self, info):
    self.email = info['email']
    self.id = info['sub']

  @classmethod
  def Query(cls, user_id):
    del user_id

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

    return cls(info)
