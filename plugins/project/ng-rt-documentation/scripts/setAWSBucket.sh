#!/bin/bash

gitlab_branch=$1

getCustomer() {
  # dev/2.0_feature_TN4711-scuk
  # customer = test
  [[ $gitlab_branch =~ @([^@]+)$ ]]; CUSTOMER=${BASH_REMATCH[1]}
  CUSTOMER=$(echo $CUSTOMER | tr '[:upper:]' '[:lower:]')
}

getInternalBranch() {
  local BRANCH=$(echo "${gitlab_branch%%/*}")
  case $BRANCH in
    dev)
      BUILD_BRANCH=$'s3://ng-rt-development'
      ;;
    dev-hf)
      BUILD_BRANCH=$'s3://ng-rt-development-hotfix'
      ;;
    cons)
      BUILD_BRANCH=$'s3://ng-rt-consolidation'
      ;;
    cons-hf)
      BUILD_BRANCH=$'s3://ng-rt-consolidation-hotfix'
      ;;
    prod)
        BUILD_BRANCH=$'s3://ng-rt-production'
      ;;
    prod-hf)
        BUILD_BRANCH=$'s3://ng-rt-production-hotfix'
      ;;
    *)
      BUILD_BRANCH=$'s3://ng-rt-wip'
      ;;
  esac
}

getCustomBranch() {
  local BRANCH=$(echo "${gitlab_branch%%/*}")
  case $BRANCH in
    dev)
      BUILD_BRANCH=$'s3://ng-rt-public-development'
      ;;
    dev-hf)
      BUILD_BRANCH=$'s3://ng-rt-public-development-hotfix'
      ;;
    cons)
      BUILD_BRANCH=$'s3://ng-rt-public-consolidation'
      ;;
    cons-hf)
      BUILD_BRANCH=$'s3://ng-rt-public-consolidation-hotfix'
      ;;
    prod)
        BUILD_BRANCH=$'s3://ng-rt-public-production'
      ;;
    prod-hf)
        BUILD_BRANCH=$'s3://ng-rt-public-production-hotfix'
      ;;
    *)
      BUILD_BRANCH=$'s3://ng-rt-public-wip'
      ;;
  esac
}

# customer build or not ?
# getCustomer

# get S3 bucket name based on branch Name

if [ -z "$PROJECT" ]
then
# internal build
  # echo 'Internal build'
  getInternalBranch
  if [ "$BRANCH_TYPE" = "feature" ]
  then
    BUILD_BRANCH=$'s3://ng-rt-wip'
  fi
  echo $BUILD_BRANCH
else
# customer specific build
  # echo 'Custom build'
  getCustomBranch
  if [ "$BRANCH_TYPE" = "feature" ]
  then
    BUILD_BRANCH=$'s3://ng-rt-public-wip'
  fi
  echo $BUILD_BRANCH-$PROJECT
fi
