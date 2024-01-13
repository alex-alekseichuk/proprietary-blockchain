#!/bin/bash 
if [ -z "$1" ]; then
  echo "Issue not set"
fi
if [ -z "$API_TOKEN" ]; then
  echo "API_TOKEN not set"
fi

issue=$1
result=$2
info=$(curl --header "PRIVATE-TOKEN: ${API_TOKEN}" https://gitlab.project.com/api/v4/projects/3/issues/$issue)

# examples
# title = title
# dueDate = milestone.due_date
# status = state
# assignee = assignees[0].name
# milestone = milestone.title

#return the complete json if 2nd argument is missing
echo $info | jq ."$result"
