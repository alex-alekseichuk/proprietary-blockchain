#!/bin/bash

if [ -z "$1" ]; then
  echo "Issue not set"
fi

if [ -z "$API_TOKEN" ]; then
  echo "API_TOKEN not set"
fi

issue=$1

#curl --request PUT --header "PRIVATE-TOKEN: ${API_TOKEN}" https://gitlab.project.com/api/v4/projects/3/issues/${issue}?state_event=reopen
curl --request PUT --silent --header "PRIVATE-TOKEN: 29_JizymAykLzw4NyjzU" --silent --output /dev/null --write-out '%{http_code}' https://gitlab.project.com/api/v4/projects/3/issues/${issue}?state_event=close