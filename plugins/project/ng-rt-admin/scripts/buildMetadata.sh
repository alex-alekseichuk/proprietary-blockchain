#!/bin/bash

version=$PLUGIN_VERSION
echo "{ \"version\": \"$version.$(date +%V).$CI_PIPELINE_ID\" }" > ./$CI_PROJECT_NAME.json

