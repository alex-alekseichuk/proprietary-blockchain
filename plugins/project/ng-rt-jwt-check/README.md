Branch    | Pipeline | Coverage
----------|----------|----------
Dev/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-jwt-check/badges/dev/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-check/commits/dev/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-jwt-check/badges/dev/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-check/commits/dev/3.0)
Cons/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-jwt-check/badges/cons/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-check/commits/cons/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-jwt-check/badges/cons/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-check/commits/cons/3.0)
Prod/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-jwt-check/badges/prod/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-check/commits/prod/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-jwt-check/badges/prod/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-jwt-check/commits/prod/3.0)

## Authentication checking based on JWT
This extension is adding “Authentication checking” capabilities based on Javascript Web Tokens aka JWT. This extension is implemented as a Service and gets called during the execution of a HTTP route to ensure that only authorized and authenticated users or applications can execute enabled HTTP(s) routes.

# Run dependency check

In a plugin folder, run Depcheck to find out which dependencies

*  are used
*  are not used
*  are missing from package.json.

Install Depcheck

```
npm install -g depcheck
```

Navigate to the plugin folder (here, it is **ng-rt-jwt-check**) and run
```
depcheck
```

Currently, there are no unused dependencies in ng-rt-jwt-check.
