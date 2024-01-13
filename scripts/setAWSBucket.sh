y=$1
getBranch() {
  echo $y
  local BRANCH=$(echo "${y%%/*}")

case $BRANCH in
  dev)
    echo 'Dev'
    BUILD_BRANCH=$'s3://ng-rt-development'
    ;;
  cons)
    echo 'Cons'
    BUILD_BRANCH=$'s3://ng-rt-consolidation'
    ;;
  prod)
      echo 'Prod'
      BUILD_BRANCH=$'s3://ng-rt-production'
    ;;
  *)
    echo 'WIP Branch'
    BUILD_BRANCH=$'s3://ng-rt-wip'
    ;;
  esac
}

getBranch
echo $BUILD_BRANCH