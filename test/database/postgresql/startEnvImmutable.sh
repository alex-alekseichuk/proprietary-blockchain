#!/bin/bash

readonly THISDIR=$(cd "$(dirname "$0")" ; pwd)

DB_ENV="PostgreSQL"
BUILD_ID="D"
IMAGE_REGISTRY="registry.project.com"
IMAGE_RETHINKDB="rethinkdb:2.3.6"
IMAGE_RABBITMQ="rabbitmq:3.7.2-management-alpine"
IMAGE_TENDERMINT="tendermint/tendermint:v0.31.4"
IMAGE_POSTGRESQL_TBSP="postgres"
IMAGE_PGADMIN4="dpage/pgadmin4"

# IP Address of the PROJECT Core-Container
CORE_IP="10.10.12.153" 

# Port of the TBSP Mongo instance
MONGODB_TBSP_PORT="27017"

docker_stop_container() {
  echo 'stop all relevant Docker containers'
  docker stop T01_postgresql
  docker rm T01_postgresql  
}

delete_working_directory() {
  echo 'delete data'
  rm -rf /$NGRT_DATA/T01/postgresql
  rm -rf /$NGRT_DATA/T01/scripts
}

docker_start_container() {
  echo "docker run postgresql"
  # docker run --restart=always --detach --name T01_postgresql -p 5432:5432 -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin --volume=/$NGRT_DATA/T01/postgresql:/var/lib/postgresql/data ${IMAGE_POSTGRESQL_TBSP}
  docker run --restart=always --detach --name T01_postgresql -p 5432:5432 -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin --volume=/$NGRT_DATA/T01/postgresql:/var/lib/postgresql/data --volume=/$NGRT_DATA/T01/scripts:/var/lib/postgresql/scripts ${IMAGE_POSTGRESQL_TBSP}

  echo "sleep 30 seconds"
  sleep 30

  echo 'docker exec run create databases script for postgresql'
  docker exec --detach T01_postgresql psql -U admin -f /var/lib/postgresql/scripts/create.sql

  echo "*** Done ***"
}

docker_pull_container() {
  echo "Pull all images"
  docker pull ${IMAGE_POSTGRESQL_TBSP}
}

create_working_directory() {
  echo "creating directories for TBSP "
  mkdir  -p $NGRT_DATA/T01/postgresql || exit 1
  mkdir  -p $NGRT_DATA/T01/scripts || exit 1

  cp  ${THISDIR}/psqlscripts/create.sql $NGRT_DATA/T01/scripts/

}


main() {

  ## getIPAddress

  docker_stop_container

  delete_working_directory

  create_working_directory
  
  docker_pull_container

  docker_start_container

  
}

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