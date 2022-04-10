import logging

import flask

import config as config_module


def CreateApp(config):
  app = flask.Flask(__name__,
                    template_folder='static',
                    static_folder='static')
  app.config.from_object(config)

  # This is a workaround to serve javascript files.
  # All javascript files should be placed under /static/<path>
  @app.route('/<path:path>.js', methods=['GET'])
  def JavascriptFile(path):
    return flask.send_from_directory('static', path + '.js')

  @app.route('/')
  def Root():
    return flask.render_template('index.html')

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
