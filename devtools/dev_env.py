#!/usr/bin/env python

import argparse
import logging
import os
import subprocess
import shutil


DEVTOOLS_DIR = os.path.realpath(os.path.dirname(__file__))
ROOT_DIR = os.path.dirname(DEVTOOLS_DIR)
VENV_DIR = os.path.join(DEVTOOLS_DIR, 'venv')
REQUIREMENTS_PATH = os.path.join(DEVTOOLS_DIR, 'requirements.txt')

PIP_BIN = os.path.join(VENV_DIR, 'bin', 'pip')

BUILD_DIR = os.path.join(ROOT_DIR, 'build')
BUILD_STATIC_DIR = os.path.join(BUILD_DIR, 'static')
BACKEND_DIR = os.path.join(ROOT_DIR, 'backend')
STATIC_DIR = os.path.join(ROOT_DIR, 'static')
FRONTEND_DIR = os.path.join(ROOT_DIR, 'frontend')
FRONTEND_DIST_DIR = os.path.join(FRONTEND_DIR, 'dist')


def Init(args):
  if args.force:
    shutil.rmtree(VENV_DIR, ignore_errors=True)

  if os.path.exists(VENV_DIR):
    logging.warning('venv folder already exists, do nothing.')
    return

  subprocess.check_call(['virtualenv', VENV_DIR])
  subprocess.check_call([PIP_BIN, 'install', '--upgrade', 'pip', 'setuptools'])
  subprocess.check_call([PIP_BIN, 'install', '--requirement',
                         REQUIREMENTS_PATH])

  logging.info('')
  logging.info('venv is installed.')
  logging.info('')
  logging.info('To activate the virtual env, run:')
  logging.info('  source "%s"', os.path.relpath(os.path.join(VENV_DIR, 'bin',
                                                             'activate'),
                                                os.getcwd()))
  logging.info('')
  logging.info('To leave the virtual env, run:')
  logging.info('  deactivate')


def Build(args):
  # Build frontend first
  if args.frontend:
    logging.info('====== Building frontend ======')
    subprocess.check_call(
      ['ng', 'build', '--build-optimizer', '--baseHref="/static/"'],
      cwd=FRONTEND_DIR)

  if args.backend:
    logging.info('====== Building backend ======')
    if os.path.exists(BUILD_DIR):
      shutil.rmtree(BUILD_DIR)

    os.mkdir(BUILD_DIR)
    shutil.copy(os.path.join(ROOT_DIR, 'app.yaml'), BUILD_DIR)
    # shutil.copy(os.path.join(BACKEND_DIR, 'main.py'), BUILD_DIR)
    shutil.copytree(BACKEND_DIR, BUILD_DIR, dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns('*.pyc', '__pycache__'))
    shutil.copy2(REQUIREMENTS_PATH, os.path.join(BUILD_DIR, 'requirements.txt'))
    shutil.copytree(os.path.join(ROOT_DIR, 'templates'),
                    os.path.join(BUILD_DIR, 'templates'))
    shutil.copytree(FRONTEND_DIST_DIR, BUILD_STATIC_DIR)


def RunLocalServer(args):
  os.chdir(BUILD_DIR)
  # The dev_appserver.py needs python2...
  subprocess.check_call(
    ['dev_appserver.py', 'app.yaml',
     '--port', '5000',
     '--dev_appserver_log_level=debug',
     '--env_var', 'OAUTHLIB_INSECURE_TRANSPORT=1',
     '--datastore_path=../local_data/local_datastore',
     ])


def Deploy(args):
  cmd = ['gcloud', 'app', 'deploy']
  if args.project:
    cmd += ['--project', args.project]

  subprocess.check_call(cmd, cwd=BUILD_DIR)


def main():
  parser = argparse.ArgumentParser()

  subparsers = parser.add_subparsers(help='subcommands')

  parser_init = subparsers.add_parser('init', help='setup venv')
  parser_init.add_argument('--force', help='delete existing venv first')
  parser_init.set_defaults(func=Init)

  parser_build = subparsers.add_parser('build', help='build code')
  parser_build.add_argument('--backend', type=bool, default=True,
                            help='Build backend code')
  parser_build.add_argument('--frontend', type=bool, default=True,
                            help='Build frontend code')
  parser_build.set_defaults(func=Build)

  # parser_run = subparsers.add_parser('run', help='run local server')
  # parser_run.set_defaults(func=RunLocalServer)

  parser_deploy = subparsers.add_parser('deploy', help='deploy on gcloud')
  parser_deploy.add_argument('--project', type=str)
  parser_deploy.set_defaults(func=Deploy)

  # Parse and run
  args = parser.parse_args()

  logging.basicConfig(level=logging.INFO)

  if not hasattr(args, 'func'):
    parser.print_help()
    parser.exit(1)

  args.func(args)


if __name__ == '__main__':
  main()
