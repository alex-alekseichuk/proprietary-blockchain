# Run docker container
docker run --name T01_postgres -p 5432:5432 -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin --volume=/$NGRT_DATA/T01/postgres:/var/lib/postgresql/data -d postgres:9.6.11-alpine

# Create Database 
docker exec -it T01_postgresql bash

psql -U admin

create database core;
  create database app;
create database red;
create database auth;

# drop Database 
drop database core;
drop database app;
drop database red;
drop database auth;

## show users
\du

## create user
CREATE ROLE username WITH LOGIN PASSWORD 'quoted password' [OPTIONS]
Where username is the user you want to create, and the password goes at the end in quotes. 

## List databases
\l

## Change database
\c core

## List all tables
\dt
user admin ?
must be the same user

## Quit 
\q

#Loopback 
https://loopback.io/doc/en/lb3/Advanced-topics-data-sources.html