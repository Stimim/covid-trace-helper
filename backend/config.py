import os


STORAGE_BUCKET_ID = os.getenv('COVID_TRACE_HELPER_STORAGE_BUCKET_ID',
                              'taiwan-covid-trace-helper.appspot.com')

ON_APPENGINE = os.getenv('SERVER_SOFTWARE', '').startswith('Google App Engine')

IS_PROD = os.getenv('COVID_TRACE_HELPER_IS_PROD') == 'TRUE'

if IS_PROD:
  DATASTORE_NAMESPACE = 'prod'
  STORAGE_ROOT_FOLDER = 'prod'
else:
  DATASTORE_NAMESPACE = 'staging'
  STORAGE_ROOT_FOLDER = 'staging'
