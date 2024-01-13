FROM registry.project.com/docker/ng-docker-node:V3.0
LABEL maintainer = "ailbek.karimov@project.com"

RUN npm config set user 1000
RUN npm config set unsafe-perm true

ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV}
ENV NODE_PATH /usr/local/lib/node_modules

ENV CI true

COPY . /tmp/ng-rt
RUN rm -rf test
RUN npm config set @sap:registry https://npm.sap.com
RUN cd /tmp/ng-rt && npm install
RUN npm install -g typescript

WORKDIR /tmp/ng-rt

ENTRYPOINT [ "node", "cli.js"]