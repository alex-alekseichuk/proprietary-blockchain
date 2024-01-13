#!/bin/bash

{ # make sure that the entire script is downloaded #
  #
  # 
  # You need to have a commercial license to make use of this code
  # in case of questions please contact us at info@project.com
  #

  info() {
    echo -e "\\033[1m\\033[32m>>>\\033[0m\\033[0m ${1}"
  }

  error() {
    echo -e "\\033[1m\\033[31m!!!\\033[0m\\033[0m ${1}"
  }

  checkPrerequisites () {
    info ""
    for i in jq awk; do
      info "Checking pre-requisite ${i}"
      if ! [ -x "$(command -v ${i})" ]; 
      then
        error "Error: ${i} is not installed." >&2
        exit 1
      fi
    done
    info ""
  }

  getPort() {
    port="$(git config --local --get gitlab.tbsp-port)"

    if [ "$port" == "" ]; then
        error ""
        error " Port for TBSP is not set"
        error " $ git config --local --add gitlab.tbsp-port <port>"
        error ""
        exit 1
    fi

  }

  getIP() {
    ip="$(git config --local --get gitlab.tbsp-ip)"

    if [ "$ip" == "" ]; then
        error ""
        error " IP for TBSP is not set"
        error " $ git config --local --add gitlab.tbsp-ip <ip>"
        error ""
        exit 1
    fi

  }

  getPwd() {
    pwd="$(git config --local --get gitlab.${user}-pwd)"

    if [ "$pwd" == "" ]; then
        error ""
        error " Password for User ${user} is not set"
        error " $ git config --local --add gitlab.${user}-pwd <pwd>"
        error ""
        exit 1
    fi
  }

  dumpIpForInterface()
  {
    IT=$(ifconfig "$1") 
    if [[ "$IT" != *"status: active"* ]]; then
      return
    fi
    if [[ "$IT" != *" broadcast "* ]]; then
      return
    fi
    ip=$(echo "$IT" | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}')
    info "Your current IP address is : $ip"
    info ""

  }

  getCurrentIP() {
    # snagged from here: https://superuser.com/a/627581/38941
    DEFAULT_ROUTE=$(route -n get 0.0.0.0 2>/dev/null | awk '/interface: / {print $2}')
    if [ -n "$DEFAULT_ROUTE" ]; then
      dumpIpForInterface "$DEFAULT_ROUTE"
    else
      for i in $(ifconfig -s | awk '{print $1}' | awk '{if(NR>1)print}')
      do 
        if [[ $i != *"vboxnet"* ]]; then
          dumpIpForInterface "$i"
        fi
      done
    fi
  }
    
  getToken() {
      getCommon
      info "requesting JWT Login Token for user ${user}"
      getPwd
      token=$(curl -s -X POST  --header "Content-Type: application/json" --header "Accept: application/json"\
      -d "{ \"username\": \"${user}\", \"password\": \"${pwd}\" }" \
      ${auth_url} | jq -r '.token')
    }

  getCommon() {
    getIP
    getPort
    readonly route="auth/login"
    readonly base_url="${ip}:${port}"
    readonly auth_url="${base_url}/${route}"
  }


}
