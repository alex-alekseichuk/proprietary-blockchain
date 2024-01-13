#!/bin/bash
echo 'BRANCH IS: '$CI_COMMIT_REF_NAME
# get branch name and escape all '/' symbols in it
BRANCH=$(bash ./scripts/getDependenciesBranch.sh $CI_COMMIT_REF_NAME )
BRANCH=$(echo $BRANCH | sed 's/\//\\\//g')
echo 'Dependency branch being changed to: '$BRANCH

REPLACE_REGEXP='s/\(.*\).git#develop\"/\1.git#'$BRANCH'\"/g'

##echo $REPLACE_REGEXP

if [ -f ./package.json ]; then
   sed -i -e $REPLACE_REGEXP package.json
fi
if [ -f ./client/bower.json ]; then
   sed -i -e $REPLACE_REGEXP ./client/bower.json
fi
