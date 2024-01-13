#!/bin/bash

branch_type=$1
branch_type=$1

FILE=$1

checkFile() {

FILE="123.yml"
if [ -e ./changelog/"$FILE" ]; then
    echo "File exists"
else
    echo "Changelog does not exist"
    exit 1
fi
}
