Branch    | Pipeline | Coverage
----------|----------|----------
Dev/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/badges/dev/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/commits/dev/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/badges/dev/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/commits/dev/3.0)
Cons/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/badges/cons/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/commits/cons/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/badges/cons/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/commits/cons/3.0)
Prod/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/badges/prod/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/commits/prod/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/badges/prod/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-sc-core/commits/prod/3.0)

# Run dependency check

In a plugin folder, run Depcheck to find out which dependencies

*  are used
*  are not used
*  are missing from package.json.

Install Depcheck

```
npm install -g depcheck
```

Navigate to the plugin folder (here, it is **ng-rt-nodes-sc-core**) and run
```
depcheck
```

Currently, this plugin contains the following unused dev dependencies:
```
Unused devDependencies
* proxyquire
* node-red
* should
```

