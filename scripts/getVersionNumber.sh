y=$1

getVersionNumber() {
  local STAGE=$(echo ${y:0:3})
  if [ $STAGE = 'dev' ]
  then
    GET_VERSION_NUMBER_RESULT=$(echo ${y:4:3})
  else
    GET_VERSION_NUMBER_RESULT=$(echo ${y:5:3})
  fi

  if [ "$GET_VERSION_NUMBER_RESULT" == "2-0" ]; then
  GET_VERSION_NUMBER_RESULT="2"
  fi
}

getVersionNumber
#version fix just for v3 right now. will/should be fixed
echo "$GET_VERSION_NUMBER_RESULT-m"