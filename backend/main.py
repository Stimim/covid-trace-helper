import logging

import flask

import config as config_module
from datastore import user as user_module
from datastore import photo as photo_module


def CreateApp(config):
  app = flask.Flask(__name__,
                    template_folder='static',
                    static_folder='static')
  app.config.from_object(config)

  @app.route('/test-login')
  def TestLogin():
    user = user_module.User.GetUser()
    return f'email: {user.email}, user_id: {user.id}'

  @app.route('/api/upload-image', methods=['POST'])
  def UploadImage():
    logging.info('in upload-image')
    print(flask.request.files)
    if 'image[]' not in flask.request.files:
      return {'error': 'cannot find image[] in request.files'}, 400

    print(flask.request.form)
    try:
      date = flask.request.form['date']
      region = flask.request.form['region']
      source = flask.request.form['source']
    except Exception:
      return {'error': 'Invalid form data'}, 400

    image_list = flask.request.files.getlist('image[]')
    result_list = []
    has_error = False
    for file in image_list:
      if not file or file.filename == '':
        continue
      try:
        photo = photo_module.Photo.Save(file, date, source, region)
        result_list.append({
          'name': file.filename,
          'checksum': photo.checksum,
        })
      except Exception as e:
        result_list.append({
          'name': file.filename,
          'error': str(e),
        })
    return {'results': result_list}, (400 if has_error else 200)

  @app.route('/api/image', methods=['GET'])
  def QueryImage():
    try:
      date = flask.request.args['date']
      region = flask.request.args.get('region') or None
    except Exception:
      return {'error': 'Invalid form data'}, 400
    try:
      results = photo_module.Photo.Query(date, region)
    except Exception as e:
      return {'error': str(e)}, 400

    return {'results': [photo.ToDict() for photo in results]}


  @app.route('/')
  def Root():
    return flask.render_template('index.html')

  @app.route('/upload')
  def UploadPage():
    return flask.render_template('index.html')

  @app.route('/process')
  def ProcessPage():
    return flask.render_template('index.html')

  @app.route('/policy')
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
