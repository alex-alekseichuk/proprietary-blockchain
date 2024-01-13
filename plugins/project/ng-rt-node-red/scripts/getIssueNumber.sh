#!/usr/bin/env bash
set -e
y=$1

issue=""

if  grep -q '\_' <<< $y; then
    issue=$( echo ${y} | awk -F[_@] '{print $2}')
fi

echo $issue