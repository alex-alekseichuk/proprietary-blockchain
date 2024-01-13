create database core;
create database auth;
create database app;
create database red;
create database ng_rt_bc_offchain;
create database ng_rt_bc_private;
create database ng_rt_bc_public;
create database ng_rt_logs;
create database ng_rt;
create database ng_rt_app;
create database ng_rt_auth;
create database ng_rt_jwt_auth;
create database ng_rt_node_red;
create database ng_rt_core;
create database ng_rt_red;
create database ng_rt_smart_contracts;
create database ng_scuk;
create database storage;

GRANT all privileges on database core to admin;
GRANT all privileges on database auth to admin;
GRANT all privileges on database app to admin;
GRANT all privileges on database red to admin;
GRANT all privileges on database ng_rt_bc_offchain to admin;
GRANT all privileges on database ng_rt_bc_private to admin;
GRANT all privileges on database ng_rt_bc_public to admin;
GRANT all privileges on database ng_rt_logs to admin;
GRANT all privileges on database ng_rt to admin;
GRANT all privileges on database ng_rt_app to admin;
GRANT all privileges on database ng_rt_auth to admin;
GRANT all privileges on database ng_rt_core to admin;
GRANT all privileges on database ng_rt_red to admin;
GRANT all privileges on database ng_rt_jwt_auth to admin;
GRANT all privileges on database ng_rt_node_red to admin;
GRANT all privileges on database ng_rt_smart_contracts to admin;
GRANT all privileges on database ng_scuk to admin;
GRANT all privileges on database storage to admin ;

\c storage;

CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    filename CHARACTER VARYING(255),
    file BYTEA NULL,
    chunkSizeBytes INT,
    metadata TEXT
);

CREATE TABLE filesChunks (
    id SERIAL PRIMARY KEY,
    fileId INT NOT NULL,
    index INT NOT NULL,
    file BYTEA NOT NULL,
    chunkSizeBytes INT NOT NULL,
    metadata TEXT
);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO admin;
