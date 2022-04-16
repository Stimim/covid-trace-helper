import http
import re

import flask
from google.appengine.api import wrap_wsgi_app

import config as config_module
from datastore import user as user_module
from datastore import photo as photo_module
from vision import ocr


_RE_CHECKSUM = re.compile('^[0-9a-f]{64}$')


def CreateApp(config):
  app = flask.Flask(__name__,
                    template_folder='static',
                    static_folder='static')
  app.config.from_object(config)
  app.wsgi_app = wrap_wsgi_app(app.wsgi_app, use_deferred=True)

  @app.route('/test-login')
  def TestLogin():
    user = user_module.User.GetUser()
    if user:
      return user.ToDict()
    else:
      return f'Not logged in'

  @app.route('/api/user/me', methods=['GET'])
  def GetCurrentUser():
    user = user_module.User.GetUser()
    if user:
      return user.ToDict()
    return ('Not logged in', http.HTTPStatus.UNAUTHORIZED)


  @app.route('/api/upload-image', methods=['POST'])
  def UploadImage():
    user = user_module.User.GetUser()
    if not user:
      return ('Please login to access this function',
              http.HTTPStatus.UNAUTHORIZED)
    if not user.can_upload_photo:
      return ('You cannot upload images', http.HTTPStatus.UNAUTHORIZED)

    if 'image[]' not in flask.request.files:
      return ('cannot find image[] in request.files',
              http.HTTPStatus.BAD_REQUEST)

    try:
      date = flask.request.form['date']
      region = flask.request.form['region']
      source = flask.request.form['source']
    except Exception:
      return ('Invalid form data', http.HTTPStatus.BAD_REQUEST)

    image_list = flask.request.files.getlist('image[]')
    result_list = []
    for file in image_list:
      if not file or file.filename == '':
        continue
      try:
        photo = photo_module.Photo.Create(
            file=file,
            date=date,
            source=source,
            region=region,
            uploaded_by=user.id)
        result_list.append({
          'name': file.filename,
          'checksum': photo.checksum,
        })
      except Exception as e:
        result_list.append({
          'name': file.filename,
          'error': str(e),
        })
    return {'results': result_list}

  @app.route('/api/image', methods=['GET'])
  def QueryImage():
    try:
      date = flask.request.args['date']
      region = flask.request.args.get('region') or None
    except Exception:
      return ('Invalid query', http.HTTPStatus.BAD_REQUEST)
    try:
      results = photo_module.Photo.Query(date, region)
    except Exception as e:
      return str(e), http.HTTPStatus.BAD_REQUEST

    return {'results': [photo.ToDict() for photo in results]}

  @app.route('/api/image/<string:checksum>', methods=['GET'])
  def QueryImageByChecksum(checksum: str):
    try:
      photo = photo_module.Photo.QueryByChecksum(checksum)
    except Exception as e:
      return str(e), http.HTTPStatus.BAD_REQUEST
    return {'results': [photo.ToDict()]}

  @app.route('/api/image/text_detection_result', methods=['GET'])
  def QueryImageTextDetectionResult():
    try:
      checksum = flask.request.args['checksum']
    except Exception:
      return ('Invalid query', http.HTTPStatus.BAD_REQUEST)

    try:
      results = ocr.QueryTextDetectionResult(checksum)
    except Exception as e:
      return str(e), http.HTTPStatus.BAD_REQUEST
    return {'results': results}

  @app.route('/api/image/set_process_state', methods=['POST'])
  def SetImageProcessState():
    try:
      checksum = flask.request.form['checksum']
      process_state = flask.request.form['process_state']
      assert any(process_state == x.value for x in photo_module.ProcessState)
      process_state = getattr(photo_module.ProcessState, process_state)
    except Exception:
      return ('Invalid form data', http.HTTPStatus.BAD_REQUEST)

    try:
      photo = photo_module.Photo.QueryByChecksum(checksum)
    except ValueError:
      return ('Invalid form data', http.HTTPStatus.BAD_REQUEST)

    try:
      photo.SetProcessState(process_state)
    except Exception:
      return ('BAD REQUEST', http.HTTPStatus.BAD_REQUEST)
    return {'status': 'OK'}

  @app.route('/')
  def Root():
    return flask.render_template('index.html')

  @app.route('/upload/')
  def UploadPage():
    return flask.render_template('index.html')

  @app.route('/process/')
  def ProcessPage():
    return flask.render_template('index.html')

  @app.route('/process/<string:checksum>')
  def ProcessPageWithChecksum(checksum: str):
    checksum = checksum.lower()
    if checksum and not _RE_CHECKSUM.match(checksum):
      return ('Invalid checksum', http.HTTPStatus.BAD_REQUEST)
    return flask.render_template('index.html')

  @app.route('/profile/')
  def ProfilePage():
    return flask.render_template('index.html')

  @app.route('/policy/')
  def PolicyPage():
    return flask.render_template('index.html')

  # This is a workaround to serve static files.
  # All static files should be placed under /static/<path>
  @app.route('/<path:path>', methods=['GET'])
  def EverythingElse(path):
    return flask.send_from_directory('static', path)

  return app


app = CreateApp(config_module)


if __name__ == '__main__':
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    # Flask's development server will automatically serve static files in
    # the "static" directory. See:
    # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
    # App Engine itself will serve those files as configured in app.yaml.
    app.run(host='127.0.0.1', port=8080, debug=True)
