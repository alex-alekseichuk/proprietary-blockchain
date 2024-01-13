echo 'stop mongo docker containers'
docker stop T01_rabbitmq
docker rm T01_rabbitmq
docker stop T01_tendermint
docker rm T01_tendermint
docker stop T01_rethinkdb
docker rm T01_rethinkdb
docker stop T01_mongodb_tbsp
docker rm T01_mongodb_tbsp
docker stop T01_mongodb_bsb
docker rm T01_mongodb_bsb
docker stop T01_bigchaindb
docker rm T01_bigchaindb
docker stop T01_postgresql_admin
docekr rm T01_postgresql_admin