from google.cloud import datastore as datastore_module

import config as config_module


_DATASTORE_CLIENT = None


def Client():
  global _DATASTORE_CLIENT

  if _DATASTORE_CLIENT is None:
    _DATASTORE_CLIENT = datastore_module.Client(
        namespace=config_module.DATASTORE_NAMESPACE)

  return _DATASTORE_CLIENT

