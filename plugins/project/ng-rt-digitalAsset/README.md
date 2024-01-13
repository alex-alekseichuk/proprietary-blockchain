## Pipeline Coverage

Branch    | Pipeline | Coverage
----------|----------|----------
Dev/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-digitalAsset/badges/dev/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-digitalAsset/commits/dev/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-digitalAsset/badges/dev/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-digitalAsset/commits/dev/3.0)
Cons/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-digitalAsset/badges/cons/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-digitalAsset/commits/cons/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-digitalAsset/badges/cons/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-digitalAsset/commits/cons/3.0)
Prod/3.0 :    | [![pipeline status](https://gitlab.project.com/plugins/ng-rt-digitalAsset/badges/prod/3.0/pipeline.svg)](https://gitlab.project.com/plugins/ng-rt-digitalAsset/commits/prod/3.0) | [![coverage report](https://gitlab.project.com/plugins/ng-rt-digitalAsset/badges/prod/3.0/coverage.svg)](https://gitlab.project.com/plugins/ng-rt-digitalAsset/commits/prod/3.0)

## Introduction

ng-rt-digitalAsset is the endpoint for local or remote (via HTTP) implementations.

It has no dependency towards the Blockchain Implementation; it also acts as a 'Firewall' and checks postings.  

Implementing ng-rt-blockchain, ng-rt-digital Asset has only interface definition, and will call Blockchain Provider specific modules, such as BigchainDB (already existing) and possibly Hyperledger in the future.

## Config.json

Before you begin, install the dev tools via the command:

```
npm i -g git+https://gitlab.project.com/sdk/ng-rt-dev-tools.git#dev/3.0
```

This will create a config.json file in your /.project folder.

To use the CLI, the app key for **ng-rt-digitalAsset** must be added to the config.json file.

Obtain your app key by logging into the UI as admin and:

* navigate to the top right corner and click App keys.
* click Add key to create a key.
* select **ng-rt-digitalAsset** and domain A.

After creating the key, copy and paste the app key for **ng-rt-digitalAsset** into the config.json of your home/.project folder in the following format: (Replace your existing config.json file with the format below)

```
},
"env": {
    "default": "vagrant",
    "cloud": {
      "serverType": "http",
      "serverUrl": "12.345.678.90:8143",
      "nodeRedUrl": "12.345.678.90:8144",
      "pwdPolicy": "prompt",
      "storage": "main",
      "plugins": {
        "ng-rt-admin": {
          "appKey": "your_appkey_here"
        },
        "ng-rt-digitalAsset": {
          "appKey": "your_appkey_here"
        }
      },
      "auth": {
        "admin": {
          "role": "admin",
          "password": "<PLACE_THE_ADMIN_PASSWORD_HERE>"
        }
      }
    },
```

## CreateAsset(Application login)

To post a tx using CreateAsset, the required parameters are ```assetType``` and (any one of them```ownerPublicKey```).

Required parameters can be passed as a body in a Post request.

## createAssetByApp with Authentication (JWT Token)

* First, generate the JWT token:
```
curl -X POST --header 'Content-Type: application/x-www-form-urlencoded' --header 'Accept: application/json' -d 'appID=ng-rt-digitalAsset&appKey=<YOUR_APP_KEY_HERE>' 'http://<YOUR_URL_HERE>/auth/applogin'
```

Replace ```<YOUR_APP_KEY_HERE>``` with your app key for **ng-rt-digitalAsset** generated in your own TBSP instance. You will then receive a token.


* Then, post the transaction with the created JWT token:

Curl Command to pass data as JSON String
```
curl --request POST --url http://<YOUR_URL_HERE>/ng-rt-digitalAsset/assets/app --header 'authorization: JWT <YOUR_JWT_TOKEN_HERE>' --header 'content-type: application/json' --data '{"tx": {"name": "test","date": "120319"} ,"amount":"1","assetType":"tendermint_blob","assetFormat":{"sdkVersion" : "3.0", "keyPairType":"Ed25519","driverType":"bdbDriver","encodeType":"base64"},"txMethod":"Commit","keySource":"generate"}'
```
Set the parameter ``isSigned`` to ``true`` if you want the client to sign the transaction (default value is false).


curl command to pass data as JSON file
```
curl --request POST --url http://<YOUR_URL_HERE>/ng-rt-digitalAsset/assets/app --header 'authorization: JWT <YOUR_JWT_TOKEN_HERE>' --header 'content-type: application/json' --data '@path-to-json-file'
```
 Replace ```<YOUR_JWT_TOKEN_HERE>``` authorization token with the token from the output above.

## Retrieve your transaction and asset

Curl command to get transaction using txId:
```
$  curl --request GET \
        --url '<YOUR_URL_HERE>/ng-rt-digitalAsset/transactions/app/<YOUR_TRANSACTION_ID_HERE>' \
        --header 'Accept: application/json' \
        --header 'Authorization: JWT <YOUR_JWT_TOKEN_HERE>' \
        --header 'Content-Type: text/plain' \
```

Curl command to get asset using txId:
```
$  curl --request GET \
        --url '<YOUR_URL_HERE>/ng-rt-digitalAsset/assets/app/ <YOUR_TRANSACTION_ID_HERE>' \
        --header 'Accept: application/json' \
        --header 'Authorization: JWT <YOUR_JWT_TOKEN_HERE>' \
        --header 'Content-Type: text/plain' \
```

## Retrieve balance with public key
Curl command:
```
$ curl --request GET   --url '<YOUR_URL_HERE>/ng-rt-digitalAsset/accounts/<PUBLIC_KEY>/balance' --header 'content-type: application/json' --data '{"assetType":"TYPE_OF_ASSET" }'

```

## Retrieve transaction history using Public Key
Curl command:
```
$ curl --request GET \
       --url '<YOUR_URL_HERE>/ng-rt-digitalAsset/accounts/<PUBLIC_KEY>/txHistory' --header 'authorization: JWT <YOUR_JWT_TOKEN_HERE>' --header 'content-type: application/json' --data '{"assetType":"TYPE_OF_ASSET" }'
```

## Retrieve asset history using assetId
Curl command:
```
$ curl --request GET \
       --url '<YOUR_URL_HERE>/ng-rt-digitalAsset/assets/<ASSET_ID>/history' \ 
       --header 'authorization: JWT <YOUR_JWT_TOKEN_HERE>' --header 'content-type: application/json' --data '{"assetType":"TYPE_OF_ASSET" }'
```

## Retrieve asset with public key(owner)
Generate a JWT token:
```
curl -X POST --header 'Content-Type: application/x-www-form-urlencoded' --header 'Accept: application/json' -d 'appID=ng-rt-digitalAsset&appKey=<YOUR_APP_KEY_HERE>' 'http://<YOUR_URL_HERE>/auth/applogin'
```

After obtaining the JWT token, run this curl command to get the transaction:
```
curl --request GET \
  --url '<YOUR_URL_HERE>/ng-rt-digitalAsset/accounts/<YOUR_PUBLIC_KEY_HERE/assets' \
  --header 'authorization: JWT <YOUR_JWT_TOKEN_HERE>' --header 'content-type: application/json' --data '{"assetType":"TYPE_OF_ASSET" }'
```

## Retrieve asset owner with asset ID

```
curl --request GET \
  --url '<YOUR_URL_HERE>/ng-rt-digitalAsset/assets/YOUR_ASSET_ID_HERE/owner' \
  --header 'authorization: JWT <YOUR_JWT_TOKEN_HERE>' --header 'content-type: application/json' --data '{"assetType":"TYPE_OF_ASSET" }'
```

## Retrieve transaction with metadata

Find a transaction by setting the metadata for specifying ```value``` and ```property``` in the cURL call.

In the example below, the property ```clientId``` contains the value ```test```. 

```
curl --request GET \
  --url '<YOUR_URL_HERE>/ng-rt-digitalAsset/transactions' \
  --header 'authorization: JWT <YOUR_JWT_TOKEN_HERE>' --header 'content-type: application/json' --data '{"assetType":"TYPE_OF_ASSET","value":"YOUR_VALUE_HERE","property":"YOUR_PROPERTY_HERE" }'
```

## Retrieve asset with metadata

Find an asset by setting the metadata for specifying ```value``` and ```property``` in the cURL call.

In the example below, the property ```clientId``` contains the value ```test```. 

```
curl --request GET \
  --url '<YOUR_URL_HERE>/ng-rt-digitalAsset/assets' \
  --header 'authorization: JWT <YOUR_JWT_TOKEN_HERE>' --header 'content-type: application/json' --data '{"assetType":"TYPE_OF_ASSET", "value":"YOUR_VALUE_HERE","property":"YOUR_PROPERTY_HERE" }'
```

## Create Digital Asset Definition with Authentication (JWT Token)

Create a Digital Asset definition by specifying the parameters for the digital asset.

Required parameters can be passed as a query parameters in a POST request.

### Create a JWT token

Create a JWT token to access your TBSP instance as the admin user. 

```
    curl --request POST \
      --url <YOUR_URL_HERE>/auth/login \
      --header 'content-type: application/json' \
      --data '{
        "username": "admin",
        "password": "<YOUR_PASSWORD_HERE>"
    }'
```

Replace ```<YOUR_PASSWORD_HERE>``` with the administrator password.

A JWT token for the TBSP instance will then be displayed.

### Create a digital asset definition

Create a Digital Asset definition by including the generated JWT token, specifying the parameters for the digital asset:
```
    curl --request POST \
      --url <YOUR_URL_HERE>/ng-rt-digitalAsset/assetDefinitions \
      --header 'authorization: JWT <YOUR_JWT_TOKEN_HERE> \
      --header 'content-type: application/json' \
      --data '{
        "assetDefinition": {
        "digitalAsset": "Car",
        "digitalAssetDescription": "Car asset description",
        "createTransactionAllowedBySystem": true,
        "transferOwnershipAllowedBySystem": true,
        "createTransactionAllowedByUser": true,
        "transferOwnershipAllowedByUser": true,
        "verifySignature": true,
        "validateSchema": true,
        "divisibleAsset": false,
        "fungibleAsset": false,
        "blockchainProvider": "T",
        "blockchainProviderVersion": "0.30.0",
        "blockchainDriver": "bdbDriver",
        "blockchainDriverVersion": "3.0.0",
        "HTTPBlockchainIPAddress": "*default",
        "HTTPBlockchainPort": 26657
    }
    }'
```

### Retrieve the Digital Asset Definition

Retrieve the Digital Asset definition by including the generated JWT token and specifying the ```assetType``` (in this case, it is ```tendermint_blob```):
```
curl --request GET \
  --url 'http://<YOUR_URL_HERE>/ng-rt-digitalAsset/assetDefinitions/<TYPE_OF_ASSET>' \
  --header 'authorization: JWT <YOUR_JWT_TOKEN_HERE>' \
  --header 'content-type: application/json'
```

