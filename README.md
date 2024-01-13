## Blockchain Platform

## Manual Installation - silent install

  - `npm i`
  - `copy `*.lic` files to `config/licenses`
  - `node cli configure --silent`
  - `node cli run` system running

## Reset the entire system incl databased entries

  - `node cli init --silent`
  - `node cli configure --silent`
  - `node cli run` system running
  -

## run via dockerfile

```
node cli.js run --loglevel=TRACE --skipAllConnectivityTests --BUILD_ID=D
```

