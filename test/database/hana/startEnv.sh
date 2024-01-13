#!/bin/bash

readonly THISDIR=$(cd "$(dirname "$0")" ; pwd)

DB_ENV="SAP Hana"
BUILD_ID="D"
IMAGE_REGISTRY="registry.project.com"
IMAGE_RETHINKDB="rethinkdb:2.3.6"
IMAGE_="rethinkdb:2.3.6"
IMAGE_RABBITMQ="rabbitmq:3.7.2-management-alpine"
IMAGE_TENDERMINT="tendermint/tendermint:v0.31.3"
IMAGE_POSTGRESQL_TBSP="postgres:9.6.11-alpine"
IMAGE_PGADMIN4="dpage/pgadmin4"


# IP Address of the PROJECT Core-Container
CORE_IP="10.10.12.167" 

# Port of the TBSP Mongo instance
MONGODB_TBSP_PORT="27017"

docker_stop_container() {
  echo 'stop all relevant Docker containers'
  . ${THISDIR}/stopContainer.sh
}

delete_working_directory() {
  echo 'delete data'
  rm -rf /$NGRT_DATA/T01/
}

docker_start_container() {

  echo "docker run postgresql"
  docker run --restart=always --detach --name T01_postgresql -p 5432:5432 -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin --volume=/$NGRT_DATA/T01/postgresql:/var/lib/postgresql/data --volume=/$NGRT_DATA/T01/scripts:/var/lib/postgresql/scripts ${IMAGE_POSTGRESQL_TBSP}

  echo "docker run rethink - as a storageProvider"
  docker run --detach --name=T01_rethinkdb --publish=28015:28015 --publish=58080:8080 --restart=always --volume=/$NGRT_DATA/T01/rethinkdb:/data ${IMAGE_RETHINKDB}

  echo "docker run Blockchain Provider"

  echo "docker init Consensus Protocol"
  docker run --rm --volume=/$NGRT_DATA/T01/tmdata:/tendermint ${IMAGE_TENDERMINT} init

  echo "docker run Consensus Protocol"
  docker run --detach --name=T01_tendermint --publish=26656:26656 --publish=26657:26657 --restart=always --volume=/$NGRT_DATA/T01/tmdata:/tendermint ${IMAGE_TENDERMINT} node --consensus.create_empty_blocks=false --proxy_app=tcp://${CORE_IP}:26658

  echo "docker run rabbitMQ"
  docker run  --restart=always  -d --hostname T01_rabbitmq  --name T01_rabbitmq  -p 5172:5672 -p 15672:15672 ${IMAGE_RABBITMQ}

  echo 'docker run postgresql admin'
  docker run --restart=always --detach --name T01_postgresql_admin -p 8888:80 -e "PGADMIN_DEFAULT_EMAIL=admin@example.com" -e "PGADMIN_DEFAULT_PASSWORD=admin" ${IMAGE_PGADMIN4}
  
}

docker_pull_container() {
  echo "Pull all images"
  docker pull ${IMAGE_RETHINKDB}
  docker pull ${IMAGE_RABBITMQ}
  docker pull ${IMAGE_TENDERMINT}
}

create_working_directory() {
  
  mkdir  -p $NGRT_DATA/T01/rethinkdb || exit 1

  # write permission for tendermint
  mkdir -p $NGRT_DATA/T01/tmdata/config  || exit 1
  chmod 777 $NGRT_DATA/T01/tmdata/config || exit 1
  mkdir -p $NGRT_DATA/T01/tmdata/data  || exit 1
  chmod 777 $NGRT_DATA/T01/tmdata/data || exit 1

  mkdir  -p $NGRT_DATA/T01/postgresql || exit 1
  mkdir  -p $NGRT_DATA/T01/scripts || exit 1

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

getIPAddress() {
  ip=`ipconfig getifaddr en1`

  echo "Please enter IP Address of your TBSP core : $ip :"
  read newip
  [ -n "$newip" ] && ip=$newip
  CORE_IP=${ip}
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

echo "Provisioning"

## main()

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
echo
echo $(date)
echo
echo "*** Done ***"
echo