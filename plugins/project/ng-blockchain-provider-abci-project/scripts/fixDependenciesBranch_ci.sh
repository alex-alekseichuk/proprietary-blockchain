#!/bin/bash
echo 'BRANCH IS: '$CI_COMMIT_REF_NAME
# get branch name and escape all '/' symbols in it
echo 'Dependency branch being changed to: '$CI_COMMIT_REF_NAME

REPLACE_REGEXP='s/dev\/[0-9].[0-9]\"/\'$CI_COMMIT_REF_NAME'\"/g'

##echo $REPLACE_REGEXP
if [ -f ./package.json ]; then
    echo "coming in to replace"
    sed -i -e $REPLACE_REGEXP package.json
fi
