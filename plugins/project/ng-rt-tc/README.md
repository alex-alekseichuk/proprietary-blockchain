Develop : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-tc/badges/develop/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/develop)
Consolidation : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-tc/badges/consolidation/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/consolidation)
Production : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-tc/badges/production/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/production)

Dev/2.0 : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-tc/badges/dev/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/dev/2.0)
Cons/2.0 : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-tc/badges/cons/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/cons/2.0)
Prod/2.0 : [![pipeline status](https://gitlab.project.com/plugins/ng-rt-tc/badges/prod/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/prod/2.0)


Develop [![coverage report](https://gitlab.project.com/plugins/ng-rt-tc/badges/develop/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/develop)
Consolidation [![coverage report](https://gitlab.project.com/plugins/ng-rt-tc/badges/consolidation/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/consolidation)
Production [![coverage report](https://gitlab.project.com/plugins/ng-rt-tc/badges/production/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/production)

Dev/2.0 [![coverage report](https://gitlab.project.com/plugins/ng-rt-tc/badges/dev/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/dev/2.0)
Cons/2.0 [![coverage report](https://gitlab.project.com/plugins/ng-rt-tc/badges/cons/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/cons/2.0)
Prod/2.0 [![coverage report](https://gitlab.project.com/plugins/ng-rt-tc/badges/prod/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-tc/commits/prod/2.0)

Terms and Conditions

# Run dependency check

In a plugin folder, run Depcheck to find out which dependencies

*  are used
*  are not used
*  are missing from package.json.

Install Depcheck

```
npm install -g depcheck
```

Navigate to the plugin folder (here, it is **ng-rt-tc**) and run
```
depcheck
```

Currently, this plugin contains the following unused dependencies:

* path
