Branch    | Pipeline | Coverage
----------|----------|----------
Dev/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-abci-server/badges/dev/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-abci-server/commits/dev/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-abci-server/badges/dev/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-abci-server/commits/dev/3.0)
Cons/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-abci-server/badges/cons/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-abci-server/commits/cons/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-abci-server/badges/cons/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-abci-server/commits/cons/3.0)
Prod/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-abci-server/badges/prod/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-abci-server/commits/prod/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-abci-server/badges/prod/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-abci-server/commits/prod/3.0)


## exec into the container

```
docker exec -it 23399c3cecd3 /bin/sh
```

# Run dependency check

In a plugin folder, run Depcheck to find out which dependencies

*  are used
*  are not used
*  are missing from package.json.

Install Depcheck

```
npm install -g depcheck
```

Navigate to the plugin folder (here, it is **ng-rt-abci-server**) and run
```
depcheck
```

Currently, there are no unused dependencies. 