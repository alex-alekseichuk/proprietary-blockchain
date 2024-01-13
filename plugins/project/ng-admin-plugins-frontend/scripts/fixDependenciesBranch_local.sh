#!/bin/bash
BRANCH="cons/3.0"
echo 'BRANCH IS: '$BRANCH
# get branch name and escape all '/' symbols in it
BRANCH=$(echo $BRANCH | sed 's/\//\\\//g')
echo 'Dependency branch being changed to: '$BRANCH

REPLACE_REGEXP='s/dev\/[0-9].[0-9]\"/\'$BRANCH'\"/g'

##echo $REPLACE_REGEXP
if [ -e package.json ]; then
    echo "coming in to replace"
    sed -i -e $REPLACE_REGEXP package.json
fi
