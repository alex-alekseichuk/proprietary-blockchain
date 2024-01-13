Develop : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-node-red/badges/develop/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/develop)
Consolidation : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-node-red/badges/consolidation/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/consolidation)
Production : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-node-red/badges/production/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/production)

Dev/2.0 : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-node-red/badges/dev/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/dev/2.0)
Cons/2.0 : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-node-red/badges/cons/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/cons/2.0)
Prod/2.0 : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-node-red/badges/prod/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/prod/2.0)


Develop [![coverage report](https://gitlab.project.com/plugins/ng-rt-node-red/badges/develop/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/develop)
Consolidation [![coverage report](https://gitlab.project.com/plugins/ng-rt-node-red/badges/consolidation/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/consolidation)
Production [![coverage report](https://gitlab.project.com/plugins/ng-rt-node-red/badges/production/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/production)

Dev/2.0 [![coverage report](https://gitlab.project.com/plugins/ng-rt-node-red/badges/dev/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/dev/2.0)
Cons/2.0 [![coverage report](https://gitlab.project.com/plugins/ng-rt-node-red/badges/cons/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/cons/2.0)
Prod/2.0 [![coverage report](https://gitlab.project.com/plugins/ng-rt-node-red/badges/prod/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-node-red/commits/prod/2.0)

# Run dependency check

In a plugin folder, run Depcheck to find out which dependencies

*  are used
*  are not used
*  are missing from package.json.

Install Depcheck

```
npm install -g depcheck
```

Navigate to the plugin folder (here, it is **ng-rt-node-red**) and run
```
depcheck
```

Currently, the following dependencies are not used:
```
Unused dependencies
* fs
* loopback-connector-nodes-for-Node-RED
* path
```