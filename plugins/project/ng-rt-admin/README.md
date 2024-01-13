Branch    | Pipeline | Coverage
----------|----------|----------
Dev/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-admin/badges/dev/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-admin/commits/dev/2.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-admin/badges/dev/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-admin/commits/dev/2.0)
Cons/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-admin/badges/cons/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-admin/commits/cons/2.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-admin/badges/cons/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-admin/commits/cons/2.0)
Prod/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-admin/badges/prod/2.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-admin/commits/prod/2.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-admin/badges/prod/2.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-admin/commits/prod/2.0)




# ng-rt-admin

Web UI single-page application.
It's used as a plugin for ng-rt engine.


## Build

The build is done via the dev-tools

# Run dependency check

In a plugin folder, run Depcheck to find out which dependencies

*  are used
*  are not used
*  are missing from package.json.

Install Depcheck

```
npm install -g depcheck
```

Navigate to the plugin folder (here, it is **ng-rt-admin**) and run
```
depcheck
```
This plugin contains the following unused dependencies:
```
Unused dependencies:
* browser-request
* bs58
* crypto
* five-bells-condition
* formidable
* js-sha3
* multer
* ng-rt-components-ui
* path
* react
* react-dom
* redux
* redux-thunk
* request
* request-promise
* sha3
```
