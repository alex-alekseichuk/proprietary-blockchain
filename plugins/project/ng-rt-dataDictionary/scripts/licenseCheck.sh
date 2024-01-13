#!/bin/bash

#
# chechLVL1
#
# Check for all plugins very genericly and filter out AGPk anf SSPL licenses
#
function checkLVL1() {
  info " Executing LVL-1 check for ${CI_PROJECT_PATH}"
  info " Version ${pluginVersion}"
  info " Branch Type : ${branchType}"
  info " LCM Branch : ${lcmBranch}"
  info " Project : ${project}"
  info ""
  npx git+ssh://git@gitlab.project.com:os/legally.git --module=${CI_PROJECT_PATH} > license.txt
  exitCode=$?
  if [ $exitCode -ne 0 ]; then 
    info "Returncode from legally : ${exitCode}"
    error 'License check 2 or 3 failed. Please check locally your report '
    exit 1
  else
      info "All ok : ${exitCode}"
  fi
}

function main() {
  info ""
  checkLVL1
}

source $(dirname "$0")/shared/common.sh
checkPrerequisites

main "$@"

