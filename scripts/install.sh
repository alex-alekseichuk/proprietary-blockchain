#!/bin/bash
# it's for postgresql db config, for mongo see antoher script/doc

# To run the script
# 1. setup NGRT_DATA env var:
#   export NGRT_DATA=/home/alex/Projects/project/runtime/v3
# 2. copy license files to config/licenses/
1009
if [ ! $NGRT_DATA ]; then
    echo 'NGRT_DATA env var is not set'
    exit 1
fi

readonly THISDIR=$(cd "$(dirname "$0")" ; pwd)

DB_ENV="PostgreSQL"
BUILD_ID="D"
IMAGE_REGISTRY="registry.project.com"
IMAGE_RABBITMQ="rabbitmq:3.7.2-management-alpine"
IMAGE_TENDERMINT="tendermint/tendermint:v0.31.5"
IMAGE_POSTGRESQL_TBSP="postgres"
#IMAGE_PGADMIN4="dpage/pgadmin4"

docker_stop_container() {
  echo 'stop all relevant Docker containers'
  docker stop T01_mongodb_tbsp
  docker rm T01_mongodb_tbsp
  docker stop T01_mongodb_bsb
  docker rm T01_mongodb_bsb
  docker stop T01_rabbitmq
  docker rm T01_rabbitmq
  docker stop T01_tendermint
  docker rm T01_tendermint
  docker stop T01_bigchaindb
  docker rm T01_bigchaindb
  docker stop T01_rethinkdb
  docker rm T01_rethinkdb
  docker stop T01_postgresql
  docker rm T01_postgresql
  docker stop T01_postgresql_admin
  docker rm T01_postgresql_admin
}

delete_working_directory() {
  echo 'delete data'
  sudo chown -R $(id -un):$(id -gn) $NGRT_DATA/T01
  rm -rf $NGRT_DATA/T01
}

docker_start_container() {
  echo "docker run postgresql"
  docker run --restart=always --detach --name T01_postgresql -p 5432:5432 -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin --volume=$NGRT_DATA/T01/postgresql:/var/lib/postgresql/data --volume=$NGRT_DATA/T01/scripts:/var/lib/postgresql/scripts ${IMAGE_POSTGRESQL_TBSP}

  echo "docker init Consensus Protocol"
  docker run --rm --volume=$NGRT_DATA/T01/tmdata:/tendermint ${IMAGE_TENDERMINT} init

  echo "Change Tendermint Config File"
  sed -i.bak 's/prometheus = false/prometheus = true/' $NGRT_DATA/T01/tmdata/config/config.toml

  echo "docker run Consensus Protocol"
  docker run --detach --name=T01_tendermint --publish=26656:26656 --publish=26657:26657 --publish=26660:26660 --restart=always --volume=$NGRT_DATA/T01/tmdata:/tendermint ${IMAGE_TENDERMINT} node --consensus.create_empty_blocks=false --proxy_app=tcp://${ip}:26658

  echo "docker run rabbitMQ"
  docker run  --restart=always  -d --hostname T01_rabbitmq  --name T01_rabbitmq  -p 5172:5672 -p 15672:15672 ${IMAGE_RABBITMQ}

#  echo 'docker run postgresql admin'
#  docker run --restart=always --detach --name T01_postgresql_admin -p 8888:80 -e "PGADMIN_DEFAULT_EMAIL=admin@example.com" -e "PGADMIN_DEFAULT_PASSWORD=admin" ${IMAGE_PGADMIN4}

  sleep 30

  echo 'docker exec run create databases script for postgresql'
  docker exec --detach T01_postgresql psql -U admin -f /var/lib/postgresql/scripts/create.sql

  echo "Containers are started."
}

docker_pull_container() {
  echo "Pull all images"
  docker pull ${IMAGE_RABBITMQ}
  docker pull ${IMAGE_TENDERMINT}
  docker pull ${IMAGE_POSTGRESQL_TBSP}
#  docker pull ${IMAGE_PGADMIN4}
}

create_working_directory() {
  echo "creating directories for TBSP "
  mkdir  -p $NGRT_DATA/T01/postgresql || exit 1
  mkdir  -p $NGRT_DATA/T01/scripts || exit 1

  cp  ${THISDIR}/install-files/create.sql $NGRT_DATA/T01/scripts/

  # write permission for tendermint
  mkdir -p $NGRT_DATA/T01/tmdata/config  || exit 1
  chmod 777 $NGRT_DATA/T01/tmdata/config || exit 1
  mkdir -p $NGRT_DATA/T01/tmdata/data  || exit 1
  chmod 777 $NGRT_DATA/T01/tmdata/data || exit 1
}

copy_config() {
 echo 'Copy config'
 cp -R ${THISDIR}/install-files/config-server/ ${PWD}/config/server
}

delete_folder() {
  echo 'Deleting existing config folders and plugins'
  rm -rf ${PWD}/plugins/
  rm -rf ${PWD}/config/data/
  rm -rf ${PWD}/config/docs/
  rm -rf ${PWD}/config/plugins/
}

main() {

  ## getIPAddress

  docker_stop_container

  delete_working_directory

  create_working_directory

  docker_pull_container

  docker_start_container

  read -r -p "Do you want to override existing configurations [y/N] " response
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

echo $(date)
main
echo $(date)
echo "*** Done ***"
