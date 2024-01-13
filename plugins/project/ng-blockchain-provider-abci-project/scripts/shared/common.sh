#!/bin/bash

{ # make sure that the entire script is downloaded #
  #
  # Copyright PROJECT BV
  # You need to have a commercial license to make use of this code
  # in case of questions please contact us at info@project.com
  #

  function info() {
    echo -e "\\033[1m\\033[32m>>>\\033[0m\\033[0m ${1}"
  }

  function error() {
    echo -e "\\033[1m\\033[31m!!!\\033[0m\\033[0m ${1}"
  }

  function debug() {
    if [[ ! -z "$DEBUG" ]]; then
        echo -e "\\033[1m\\033[94m###\\033[0m\\033[0m ${1}"
    fi
  }

  function checkPrerequisites () {
    info ""
    for i in jq awk shyaml; do
      info "Checking pre-requisite ${i}"
      if ! [ -x "$(command -v ${i})" ]; 
      then
        error "Error: ${i} is not installed." >&2
        exit 1
      fi
    done
    info ""
  }
}
