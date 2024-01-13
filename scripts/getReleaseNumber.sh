y=$1

getVersionNumber() {
  local STAGE=$(echo ${y:0:3})
  if [ $STAGE = 'dev' ]
  then
    GET_VERSION_NUMBER_RESULT='V'$(echo ${y:4:1})'.'$(echo ${y:6:1})'_develop'
  else
    STAGE=$(echo ${y:0:4})
    if [ $STAGE = 'cons' ]
    then
      GET_VERSION_NUMBER_RESULT='V'$(echo ${y:5:1})'.'$(echo ${y:7:1})'_consolidation'
    else
      if [ $STAGE = 'prod' ]
      then
        GET_VERSION_NUMBER_RESULT='V'$(echo ${y:5:1})'.'$(echo ${y:7:1})'_production'
      else
        GET_VERSION_NUMBER_RESULT='unknown'
      fi
    fi
  fi 
}

getVersionNumber
echo $GET_VERSION_NUMBER_RESULT