#!/bin/bash

#gitlab_branch='prod-hf/1.6'
gitlab_branch=$1

getLCMBranch() {
  local BRANCH=$(echo "${gitlab_branch%%/*}")
  case $BRANCH in
    dev)
      LCM_BRANCH=$BRANCH
      ;;
    dev-hf)
      LCM_BRANCH=$BRANCH
      ;;
    cons)
      LCM_BRANCH=$BRANCH
      ;;
    cons-hf)
      LCM_BRANCH=$BRANCH
      ;;
    prod)
        LCM_BRANCH=$BRANCH
      ;;
    prod-hf)
        LCM_BRANCH=$BRANCH
      ;;
    *)
      LCM_BRANCH=$'others'
      ;;
  esac
}

getLCMBranch
echo $LCM_BRANCH
