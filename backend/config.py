import os


SECRET_KEY = None
GOOGLE_CLIENT_ID = None
GOOGLE_CLIENT_SECRET = None


ON_APPENGINE = os.getenv('SERVER_SOFTWARE', '').startswith('Google App Engine')

if ON_APPENGINE:
  pass
else:
  SECRET_KEY = '00' * 32
  GOOGLE_CLIENT_ID = ''
  GOOGLE_CLIENT_SECRET = ''
