#!/bin/bash

readonly THISDIR=$(cd "$(dirname "$0")" ; pwd)
DB_ENV="MongoDB"
BUILD_ID="D"
IMAGE_REGISTRY="registry.project.com"
IMAGE_RETHINKDB="rethinkdb:2.3.6"
IMAGE_MONGODB_TBSP="mongo:3.6.8"
IMAGE_RABBITMQ="rabbitmq:3.7.2-management-alpine"
IMAGE_TENDERMINT="tendermint/tendermint:v0.31.7"

# IP Address of the PROJECT Core-Container
# CORE_IP="10.10.12.153" 

# Port of the TBSP Mongo instance
MONGODB_TBSP_PORT="27017"

docker_stop_container() {
  echo 'stop all relevant Docker containers'
  echo $0
  . $(dirname "$0")/stopContainer.sh
}

delete_working_directory() {
  echo 'delete data'
  rm -rf /$NGRT_DATA/T01/
}

docker_start_container() {
  echo "docker run rethink - as a storageProvider"
  docker run --detach --name=T01_rethinkdb --publish=28015:28015 --publish=58080:8080 --restart=always --volume=/$NGRT_DATA/T01/rethinkdb:/data ${IMAGE_RETHINKDB}

  echo "docker run mongo for TBSP storage"
  docker run --detach --name=T01_mongodb_tbsp --publish=${MONGODB_TBSP_PORT}:27017 --restart=always --volume=/$NGRT_DATA/T01/mongodb/tbsp/db:/data/db --volume=/$NGRT_DATA/T01/mongodb/tbsp/configdb:/data/configdb ${IMAGE_MONGODB_TBSP} --replSet rs0

  echo "sleep for 15 seconds"
  sleep 15

  echo "docker run mongo init"
  docker exec T01_mongodb_tbsp mongo --eval 'rs.initiate()'

  sleep 5

  echo "docker run Blockchain Provider"
  echo "docker init Consensus Protocol"
  docker run --rm --volume=/$NGRT_DATA/T01/tmdata:/tendermint ${IMAGE_TENDERMINT} init

  echo "Change Tendermint Config File"
  sed -i.bak 's/prometheus = false/prometheus = true/' /$NGRT_DATA/T01/tmdata/config/config.toml     
  
  #allow_duplicate_ip
  echo "docker run Consensus Protocol"
  docker run --detach --name=T01_tendermint --publish=26656:26656 --publish=26657:26657 --publish=26660:26660 --restart=always --volume=/$NGRT_DATA/T01/tmdata:/tendermint ${IMAGE_TENDERMINT} node --consensus.create_empty_blocks=false --proxy_app=tcp://${ip}:26658

  echo "docker run rabbitMQ"
  docker run  --restart=always  -d --hostname T01_rabbitmq  --name T01_rabbitmq  -p 5172:5672 -p 15672:15672 ${IMAGE_RABBITMQ}

}

docker_pull_container() {
  echo "Pull all images"
  docker pull ${IMAGE_RETHINKDB}
  docker pull ${IMAGE_MONGODB_TBSP}
  docker pull ${IMAGE_RABBITMQ}
  docker pull ${IMAGE_TENDERMINT}
}

create_working_directory(){
  # PROJECT TBSP directories
  echo "creating directories for TBSP "
  mkdir  -p $NGRT_DATA/T01/mongodb/tbsp/db || exit 1
  mkdir  -p $NGRT_DATA/T01/mongodb/tbsp/configdb || exit 1
  mkdir  -p $NGRT_DATA/T01/rethinkdb || exit 1

  # write permission for tendermint
  mkdir -p $NGRT_DATA/T01/tmdata/config  || exit 1
  chmod 777 $NGRT_DATA/T01/tmdata/config || exit 1
  mkdir -p $NGRT_DATA/T01/tmdata/data  || exit 1
  chmod 777 $NGRT_DATA/T01/tmdata/data || exit 1
}

copy_config() {

 echo 'Copy config'
 cp -R ${THISDIR}/server/ ${PWD}/config/server
}

delete_folder() {
  echo 'Deleting existing config folders and plugins'
  rm -rf ${PWD}/plugins/
  rm -rf ${PWD}/config/data/
  rm -rf ${PWD}/config/docs/
  rm -rf ${PWD}/config/plugins/
}

main() {
  docker_stop_container

  delete_working_directory

  create_working_directory

  docker_pull_container

  docker_start_container

  read -r -p "Do you want to overrride existing configurations [y/N] " response
  case "$response" in
      [yY][eE][sS]|[yY]) 
          copy_config
          ;;
      *)
          echo 'Keep existing configurations'
          ;;
  esac
  
  read -r -p "Do you want to delete existing Folders in config and plugins[y/N] " response
  case "$response" in
      [yY][eE][sS]|[yY]) 
          delete_folder
          ;;
      *)
          echo 'Keep existing plugins'
          ;;
  esac

}

source $(dirname "$0")/common.sh
checkPrerequisites
getCurrentIP

info "$ip"

echo "Provisioning"

read -r -p "Do you want to restart the entire environemnt based on ${DB_ENV} [y/N] " response
case "$response" in
    [yY][eE][sS]|[yY]) 
        main
        ;;
    *)
        echo 'Doing nothing'
        ;;
esac



## echo ${PWD}
echo 
echo $(date)
echo
echo "*** Done ***"
echo