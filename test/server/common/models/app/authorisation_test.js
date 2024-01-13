'use strict';
require('chai').should();
const engineHelper = require('../../../engine/helper');

/* eslint-disable no-unused-expressions */

describe.skip('Authorisation', function() {
  var request;
  var Authorisation;
  var AuthorisationData = require('../../../common/testAuthorisation');

  before(() => {
    return engineHelper.init()
            .then(() => {
              request = require('supertest-as-promised')(engineHelper.server);
              Authorisation = engineHelper.app.models.authorisation;
            })
            .then(() => Authorisation.remove({}))
            .then(() => Authorisation.create(AuthorisationData));
  });

  describe('/authorisation', function() {
    it('Object is authorised', () => {
      let requestingObject = 'Mike&requestingObjectType=User&authorisedObject=I01&authorisedObjectType=Instance';
      return request.get('/api/v2/authorisations/checkAuthorisation?requestingObject=' + requestingObject)
                .expect(200)
                .expect(function(res) {
                  res.should.be.json;
                  res.body.result.should.true;
                }

            );
    });

    it('Object is not authorised', () => {
      let requestingObject = ' Alex&requestingObjectType=User&authorisedObject=I01&authorisedObjectType=Instance';
      return request.get('/api/v2/authorisations/checkAuthorisation?requestingObject=' + requestingObject)
                .expect(200)
                .expect(function(res) {
                  res.should.be.json;
                  res.body.result.should.false;
                });
    });
  });
});
