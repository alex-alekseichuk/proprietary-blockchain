#!/bin/bash

gitlab_branch=$1

getProject() {
  # dev/2.0_TN4711@scuk
  [[ $gitlab_branch =~ @([^@]+)$ ]]; PROJECT=${BASH_REMATCH[1]}
  PROJECT=$(echo $PROJECT | tr '[:upper:]' '[:lower:]')
}

# customer or project build or not ?
getProject

echo $PROJECT
