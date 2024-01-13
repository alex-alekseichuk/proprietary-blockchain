#!/bin/bash

#
# y=dev/1.6-developer
# output = 1.6
#
y=$1
echo "${y#*/}" | sed 's/\([^_@-]*\).*/\1/'
