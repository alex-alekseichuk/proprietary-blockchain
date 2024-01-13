Branch    | Pipeline | Coverage
----------|----------|----------
Dev/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-nodes-ux/badges/dev/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-ux/commits/dev/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-nodes-ux/badges/dev/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-ux/commits/dev/3.0)
Cons/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-nodes-ux/badges/cons/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-ux/commits/cons/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-nodes-ux/badges/cons/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-ux/commits/cons/3.0)
Prod/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-nodes-ux/badges/prod/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-ux/commits/prod/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-nodes-ux/badges/prod/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-nodes-ux/commits/prod/3.0)

## Installation

aes-decrypt
aes-encrypt
byemail-key
create-digital-asset
create-digital-asset-signed-by-client
create-transaction
get-transaction-by-payload
decrypt-by-privatekey
each-item-end
each-series
email-bykey
email-sender
email-template-sender
encrypt-by-publickey
http-request
rethink-listener
sync-lister
sync-lister-end
ui-listener
uiActionForm
uiEvent
offchain-local-storage

### Install this node module
```
npm install git+ssh://git@10.0.50.108:project/ng-rt-nodes-ux.git

or install it in node-red module directly under nodes

npm install --prefix ./node_modules/node-red git+ssh://git@10.0.50.108:project/ng-rt-nodes-ux.git
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

Navigate to the plugin folder (here, it is **ng-rt-nodes-ux**) and run
```
depcheck
```

Currently, this plugin contains the following dev dependencies:
```
Unused devDependencies
* node-red
* should
```