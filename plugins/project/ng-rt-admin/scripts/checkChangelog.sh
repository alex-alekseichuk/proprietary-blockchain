#!/bin/bash

FILE=$1.yml
checkFile() {

if [ -e ./changelogs/"$FILE" ]; then
    echo "Changelog entry exists " ${FILE}
else
    echo "Changelog entry does not exist " ${FILE}
    exit 1
fi
}

if [[ $CI_COMMIT_REF_NAME == *"dev"* ]]; then
  checkFile
else
  echo "Skipping changelog check"
fi