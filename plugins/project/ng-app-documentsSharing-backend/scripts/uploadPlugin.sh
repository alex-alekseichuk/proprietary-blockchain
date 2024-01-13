#!/bin/bash

echo '$CI_PROJECT_NAME ' $CI_PROJECT_NAME
echo '$S3_URL ' $S3_URL
echo '$PLUGIN_VERSION ' $PLUGIN_VERSION
echo '$CI_AWS_REGION ' $CI_AWS_REGION




#bash doesn't handle float comparsions
versionShort=${PLUGIN_VERSION%.*}

if [ "$CI_PROJECT_NAME" = "ng-rt-smartContracts" ]
then
  echo 'Upload additional smartContract#1.4.0 Plugin to S3 Bucket' 
  aws s3 cp dist/$CI_PROJECT_NAME.zip $S3_URL/$PLUGIN_VERSION/latest/$CI_PROJECT_NAME#1.4.0.zip --region $CI_AWS_REGION
  [[ -z "${PROJECT_RSA_PRIVATEKEY}" ]] || openssl dgst -sha256 -sign /tmp/project_privatekey.pem -hex -out dist/$CI_PROJECT_NAME.zip.sha256 dist/$CI_PROJECT_NAME.zip
  aws s3 cp dist/$CI_PROJECT_NAME.zip.sha256 $S3_URL/$PLUGIN_VERSION/latest/$CI_PROJECT_NAME#1.4.0.zip.sha256 --region $CI_AWS_REGION

  #add steps for version 2 and above if required
  aws s3 cp $CI_PROJECT_NAME.json $S3_URL/$PLUGIN_VERSION/latest/metadata/$CI_PROJECT_NAME#1.4.0.json --region $CI_AWS_REGION
fi

echo 'Upload Plugin to S3 Bucket' 
aws s3 cp dist/$CI_PROJECT_NAME.zip $S3_URL/$PLUGIN_VERSION/latest/$CI_PROJECT_NAME.zip --region $CI_AWS_REGION
[[ -z "${PROJECT_RSA_PRIVATEKEY}" ]] || openssl dgst -sha256 -sign /tmp/project_privatekey.pem -hex -out dist/$CI_PROJECT_NAME.zip.sha256 dist/$CI_PROJECT_NAME.zip
aws s3 cp dist/$CI_PROJECT_NAME.zip.sha256 $S3_URL/$PLUGIN_VERSION/latest/$CI_PROJECT_NAME.zip.sha256 --region $CI_AWS_REGION


if [ "$versionShort" -ge "2" ]
then
  #when version 2 and above
  aws s3 cp $CI_PROJECT_NAME.json $S3_URL/$PLUGIN_VERSION/latest/$CI_PROJECT_NAME.json --region $CI_AWS_REGION
  [[ -z "${PROJECT_RSA_PRIVATEKEY}" ]] || openssl dgst -sha256 -sign /tmp/project_privatekey.pem -hex -out $CI_PROJECT_NAME.json.sha256 $CI_PROJECT_NAME.json
  [[ -z "${PROJECT_RSA_PUBLICKEY}" ]] || aws s3 cp /tmp/project_publickey.pem $S3_URL/$PLUGIN_VERSION/latest/$CI_PROJECT_NAME.pubkey --region $CI_AWS_REGION
  aws s3 cp $CI_PROJECT_NAME.json.sha256 $S3_URL/$PLUGIN_VERSION/latest/$CI_PROJECT_NAME.json.sha256 --region $CI_AWS_REGION

else
  #when version 1.6
  aws s3 cp $CI_PROJECT_NAME.json $S3_URL/$PLUGIN_VERSION/latest/metadata/$CI_PROJECT_NAME.json --region $CI_AWS_REGION
fi

# archiving ?
archiveProd=$(jq '.archive.prod' ./manifest.json)

if [ "$archiveProd" = "true" ]
then
  echo Archiving activated
  aws s3 cp dist/$CI_PROJECT_NAME.zip $S3_URL/$PLUGIN_VERSION/archive/$CI_PROJECT_NAME.zip.$CI_PIPELINE_ID --region $CI_AWS_REGION
  aws s3 cp $CI_PROJECT_NAME.json $S3_URL/$PLUGIN_VERSION/archive/$CI_PROJECT_NAME.json.$CI_PIPELINE_ID --region $CI_AWS_REGION
  aws s3 cp $CI_PROJECT_NAME.json.sha256 $S3_URL/$PLUGIN_VERSION/archive/$CI_PROJECT_NAME.json.sha256.$CI_PIPELINE_ID --region $CI_AWS_REGION
else
  echo Archiving NOT activated
fi