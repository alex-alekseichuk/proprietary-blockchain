#!/bin/bash

# cat modules.yaml | shyaml get-value module.websocket.allowed

dirname=${1:-.}
error_flag=false

cd $dirname

FILES=$(mktemp)
PACKAGES=$(mktemp)

function check {
    cat $(dirname "$0")/package.json \
        | jq "{} + .$1 | keys" \
        | sed -n 's/.*"\(.*\)".*/\1/p' > $PACKAGES

    info "--------------------------"
    cat $PACKAGES

    info "Checking $1..."
    while read PACKAGE
    do
      found=$(cat modules.yaml | shyaml -q get-value $PACKAGE)
      if [[ -z "$found" ]]; then
        error "Package $PACKAGE not defined"
        error_flag=true
      else
          allowed=$(cat modules.yaml | shyaml -q get-value $PACKAGE.licenseTypeAllowed)
          info "$allowed"
          if [[ -z "$allowed" ]]; then
              error "Value for module.$PACKAGE.allowed not found"
              error_flag=true
          else
              if [ "$allowed" = True ]; then
                info "Package $PACKAGE license allowed $allowed"
              else
                  error "Package $PACKAGE license is NOT allowed"
                  error_flag=true
              fi
          fi
      fi
    done < $PACKAGES
}

source $(dirname "$0")/shared/common.sh
checkPrerequisites

cat ./modules.yaml > $(dirname "$0")/$FILES

check "dependencies"
check "devDependencies"
check "peerDependencies"

if [ "$error_flag" = true ]; then
  error "An error occured . exit 1"
  exit 1
else
  info "All good . Exit 0"
  exit 0
fi
