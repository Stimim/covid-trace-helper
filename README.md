# covid-trace-helper
A tool to help filling Taiwan covid-19 traces.

# Environment Setup
- System Dependency
  - python, virtualenv, [google-cloud-sdk](https://cloud.google.com/sdk/docs/install), [node.js](https://nodejs.org/en/), [angular](https://angular.io/guide/setup-local)
- Install Packages
  - `python devtools/dev_env.py init` : this installs backend dependencies
  - `cd frontend/; npm install` : this installs frontend dependencies

# Build
```
python devtools/dev_env.py build
```

# Run local server
```
source devtools/venv/bin/activate
cd build/
python main.py
# the local server should be: localhost:8080
```

# Google Cloud API
APIs enabled:
- Cloud Logging API
- Cloud Tasks API
- Cloud Pub/Sub API
- Cloud Datastore API
- Cloud Firestore API
- Cloud Vision API
- Cloud Identity-Aware Proxy API
