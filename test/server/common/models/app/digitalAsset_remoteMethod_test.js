'use strict';
const path = require('path');
const sinon = require("sinon");
const sinonChai = require("sinon-chai");

const chai = require('chai');
chai.should();
chai.use(sinonChai);

const engineHelper = require('../../../engine/helper');

describe.skip('digitalAsset_remoteMethod', async() => {
  global.appBase = global.appBase || path.resolve(__dirname, '../../../../..');
  const config = require('ng-configservice');
  config.read('config/server/config.json');
  const bigchainConf = {
    ip: config.get('bigchainDbHost'),
    port: config.get('bigchainDbPort')
  };
  let request;
  let DigitalAssetDefinition;

  before(async() => {
    await engineHelper.init();
    request = require('supertest-as-promised')(engineHelper.server);
    DigitalAssetDefinition = engineHelper.app.models.digitalAssetDefinition;
    return DigitalAssetDefinition.remove({});
  });

  // * first test
  describe('createAssetWithoutVerifySignature', async() => {
    const assetDef = {
      digitalAsset: 'testCreateAssetAllowedBySystem',
      HTTPBlockchainIPAddress: bigchainConf.ip,
      HTTPBlockchainPort: bigchainConf.port,
      createTransactionAllowedBySystem: true,
      createTransactionAllowedByUser: true,
      verifySignature: false
    };

    before(() => {
      return DigitalAssetDefinition.create(assetDef);
    });

    it('should post CREATE tx', () => {
      let mock = sinon.mock();
      const reqData = {
        asset: {},
        amount: "10",
        metadata: {},
        creatorPubkey: config.get('keypair.public'),
        creatorPrvkey: config.get('keypair.private'),
        type: "AssetType",
        ownerPubkey: config.get('keypair.public')
      };

      mock.expects("postCreateTx").withArgs(reqData).resolves({});

      return request.post('/ng-rt-digitalAsset/createAsset')
        .send(reqData)
        .expect(200)
        .then(response => response.should.be.ok)
        .then(() => mock.verify());
    });

    // / *second test
    describe('createAssetWithVerifySignature', () => {
      const assetDef = {
        digitalAsset: 'testVerifySignature',
        HTTPBlockchainIPAddress: bigchainConf.ip,
        HTTPBlockchainPort: bigchainConf.port,
        createTransactionAllowedBySystem: true,
        createTransactionAllowedByUser: true,
        verifySignature: true
      };

      before(() => {
        return DigitalAssetDefinition.create(assetDef);
      });

      it('should post CREATE tx for verfication', () => {
        const keys = require(path.join(global.appBase, 'utils/keys'));
        const bs58 = require(path.join(global.appBase, 'utils/bs58'));

        const prvKey = config.get('keypair.private');
        const pubKey = config.get('keypair.public');

        const digitalAsset = {
          hello: '123',
          Street: 'My Street'
        };

        const signingMessage = JSON.stringify(digitalAsset);
        const signed = keys.async_sign(signingMessage, new Uint8Array(bs58.decode(prvKey)));

        let signature = String(bs58.encode(signed));
        signature = bs58.encode(signed);

        const payload = {
          digitalAsset: digitalAsset,
          signature: signature
        };

        let mock = sinon.mock();
        mock.expects("postCreateTx").withArgs(
          pubKey,
          payload,
          assetDef.HTTPBlockchainIPAddress,
          assetDef.HTTPBlockchainPort
        ).resolves({});

        return request.post('/ng-rt-digitalAsset/createAsset')
          .send({
            type: 'testVerifySignature',
            payload: JSON.stringify(payload),
            ownerPubKey: pubKey
          })
          .expect(200)
          .then(response => response.should.be.ok)
          .then(() => mock.verify());
      });
    });
  });
});
