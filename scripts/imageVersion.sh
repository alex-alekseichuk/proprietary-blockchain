y=$1
getImageVersion() {
  local VERSION=$(echo "${y#*-}" | tr - .)  
  BUILD_ID_RESULT="V${VERSION:0:3}"
}

getImageVersion
echo $BUILD_ID_RESULT