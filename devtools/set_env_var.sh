#!/bin/bash

case "$1"
  prod)
    export COVID_TRACE_HELPER_STORAGE_BUCKET_ID='taiwan-covid-trace-helper.appspot.com'
    export COVID_TRACE_HELPER_IS_PROD='TRUE'
    ;;
  dev)
    export COVID_TRACE_HELPER_STORAGE_BUCKET_ID='taiwan-covid-trace-helper.appspot.com'
    export COVID_TRACE_HELPER_IS_PROD='FALSE'
    ;;
