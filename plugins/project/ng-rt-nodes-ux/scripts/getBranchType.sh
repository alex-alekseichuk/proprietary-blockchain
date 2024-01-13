#!/bin/bash

# base
#y="dev/2.0"

# project
#y="dev/2.03@SCUK"

# feature 
#y="dev/2.0_TN123@SCUK"

# default
#y="develop"

y=$1

feature=""
project=""
base=""
branchType="default"

if  grep -q '\_' <<< $y; then
    feature=$( echo ${y} | awk -F[_@] '{print $2}')
fi

if  grep -q '\@' <<< $y; then
    project=${y##*@}
fi

if  grep -q '\/' <<< $y; then
    base=${y%%_*}
    base=${base%%@*}
fi

if [[ ! -z $feature ]];then
  branchType="feature"
elif [[ ! -z $project ]]
then
  branchType="project"
elif [[ ! -z $base ]]
then
  branchType="base"
else
  branchType="default"
fi

echo $branchType