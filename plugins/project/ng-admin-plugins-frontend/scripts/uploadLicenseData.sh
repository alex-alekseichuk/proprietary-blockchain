#!/bin/bash
echo '$CI_PROJECT_NAME ' $CI_PROJECT_NAME
echo '$S3_URL ' $S3_URL
echo '$PLUGIN_VERSION ' $PLUGIN_VERSION
echo '$CI_AWS_REGION ' $CI_AWS_REGION

#bash doesn't handle float comparsions
versionShort=${PLUGIN_VERSION%.*}
npm i git+ssh://git@gitlab.project.com:os/legally.git
npx git+ssh://git@gitlab.project.com:os/legally.git  > license.txt
echo 'Upload Plugin License to S3 Bucket'
AWS_ACCESS_KEY_ID=$CI_AWS_ACCESS_KEY_ID 
AWS_SECRET_ACCESS_KEY=$CI_AWS_SECRET_ACCESS_KEY 
aws s3 cp license.txt $S3_URL/$PLUGIN_VERSION/latest/license/$CI_PROJECT_NAME-license.txt --region $CI_AWS_REGION
