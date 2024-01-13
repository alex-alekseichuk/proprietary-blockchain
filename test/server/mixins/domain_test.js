/**
 * Tests for domain mixin.
 * Records of domain-aware models should have domainId property.
 * If domainId field is null, then it's common record.
 * Common record available for all domains.
 */
'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const should = chai.should();

const engineHelper = require('../engine/helper');
let modelDecorator;

class DomainTest {
  constructor() {
    this._modelName = 'testModel';
    this.model = null;
    this._domains = {
      id1: 'D01',
      id2: 'D02'
    };
  }

  get modelName() {
    return this._modelName;
  }

  get domains() {
    return this._domains;
  }

  find(ctx) {
    return modelDecorator.find(this.modelName, {}, ctx);
  }

  update(qStr, data, ctx) {
    return modelDecorator.updateAll(this.modelName, qStr, ctx, data);
  }

  findById(id, ctx) {
    return modelDecorator.findById(this.modelName, {}, ctx, id);
  }

  deleteById(id, ctx) {
    return modelDecorator.deleteById(this.modelName, {}, ctx, id);
  }

  destroyModel() {
    if (this.model) {
      return this.model.destroyAll();
    }
    return Promise.resolve();
  }

  async registerModel() {
    if (this.model) {
      return this.model;
    }
    this.model = await this.createModel();
    return Promise.resolve(this.model);
  }

  createRecordWithDomain(qStr, domainId) {
    const ctx = this.getContext(domainId);
    return modelDecorator.create(this._modelName, qStr, ctx);
  }

  getContext(domainId) {
    return { user: this.getUserInfo(domainId) };
  }

  createRecordWithoutDomain(qStr) {
    return this.createRecordWithDomain(qStr);
  }

  async createModel() {
    const testModel = engineHelper.app.registry.createModel({
      name: this._modelName,
      base: "PersistedModel",
      idInjection: false,
      options: {
        validateUpsert: true
      },
      persistUndefinedAsNull: true,
      properties: {
        name: {
          type: "string",
          required: true
        }
      },
      validations: [],
      relations: {
        domain: {
          type: "belongsTo",
          model: "domain",
          foreignKey: "domainId"
        }
      },
      acls: [],
      methods: {},
      mixins: {
        Domain: true
      }
    });
    await engineHelper.app.model(testModel, {
      public: true,
      dataSource: 'ng_rt'
    });
    await testModel.dataSource.automigrate(testModel.name);
    return Promise.resolve(testModel);
  }

  getUserInfo(domain) {
    return {
      id: 'testUserId',
      username: 'testUser',
      roles: [],
      trust_level: true,
      domainId: domain
    };
  }
}

const domainTest = new DomainTest();

describe('a model with domain mixin', async () => {
  before(async () => {
    await engineHelper.init();
    modelDecorator = engineHelper.services.get('loopbackModelDecorator');
    return domainTest.registerModel();
  });

  after(() => {
    return domainTest.destroyModel();
  });

  beforeEach(() => {
    return domainTest.destroyModel();
  });

  it('should add not-null domainId field in new record on insertion', async () => {
    const domains = domainTest.domains;
    const record = await domainTest.createRecordWithDomain({ name: 'Test' }, domains.id1);
    const domainId = Promise.resolve(record.domainId);
    return domainId.should.be.eventually.equal(domains.id1, `domainId should be ${domains.id1}`);
  });

  describe('when there are several records in different domains', async () => {
    let record1;
    let record2;
    const domains = domainTest.domains;
    const ctx = domainTest.getContext(domains.id1);

    beforeEach(async () => {
      // add 2 records in different domains
      record1 = await domainTest.createRecordWithDomain({ name: 'Test1' }, domains.id1);
      record2 = await domainTest.createRecordWithDomain({ name: 'Test2' }, domains.id2);
    });

    it('should list only records in current domain', async () => {
      const records = await domainTest.find(ctx);
      records.should.have.lengthOf(1);
      records[0].should.have.property('domainId').equal(domains.id1);
    });

    it('should find record in current domain', async () => {
      const record = await domainTest.findById(record1.id, ctx);
      record[0].should.have.property('domainId').equal(domains.id1);
    });

    it('should not find record in another domain', async () => {
      const record = await domainTest.findById(record2.id, ctx);
      should.not.exist(record[0]);
    });

    it('should update record in current domain', async () => {
      const qStr = { id: record1.id };
      const data = {
        name: 'Another name'
      };
      let status = await domainTest.update(qStr, data, ctx);
      status.should.have.property('count').equal(1);
    });

    it('should not update record in another domain', async () => {
      const qStr = { id: record2.id };
      const data = {
        name: 'Another name'
      };
      const status = await domainTest.update(qStr, data, ctx);
      status.should.have.property('count').equal(0);
    });

    it('should delete record in current domain', async () => {
      const status = await domainTest.deleteById(record1.id, ctx);
      status.should.have.property('count').equal(1);
    });

    it('should not delete record in another domain', async () => {
      const status = await domainTest.deleteById(record2.id, ctx);
      status.should.have.property('count').equal(0);
    });
  });

  describe('when there are record in different domains and null-domain record', async () => {
    let record1;
    let record2;
    let recordNull;
    const domains = domainTest.domains;
    const ctx = domainTest.getContext(domains.id1);

    beforeEach(async () => {
      // add 2 records in different domains
      // and 1 null-domain record
      record1 = await domainTest.createRecordWithDomain({ name: 'Test1' }, domains.id1);
      record2 = await domainTest.createRecordWithDomain({ name: 'Test2' }, domains.id2);
      recordNull = await domainTest.createRecordWithoutDomain({ name: 'Test without domain' });
    });

    it('should list only records in current domain and null-domain ones', async () => {
      const records = await domainTest.find(ctx);
      records.should.have.lengthOf(2);
    });

    it('should find record in current domain', async () => {
      const record = await domainTest.findById(record1.id, ctx);
      record[0].should.have.property('domainId').equal(domains.id1);
    });

    it('should find null-domain record', async () => {
      const record = await domainTest.findById(recordNull.id, ctx);
      record[0].should.have.property('domainId').to.be.null;
    });

    it('should not find record in another domain', async () => {
      const record = await domainTest.findById(record2.id, ctx);
      should.not.exist(record[0]);
    });

    it('should update record in current domain', async () => {
      const qStr = { id: record1.id };
      const data = {
        name: 'Another name'
      };
      const status = await domainTest.update(qStr, data, ctx);
      status.should.have.property('count').equal(1);
    });

    it('should update null-domain record', async () => {
      const qStr = { id: recordNull.id };
      const data = {
        name: 'Another name'
      };
      const status = await domainTest.update(qStr, data, ctx);
      status.should.have.property('count').equal(1);
    });

    it('should not update record in another domain', async () => {
      const qStr = { id: record2.id };
      const data = {
        name: 'Another name'
      };
      const status = await domainTest.update(qStr, data, ctx);
      status.should.have.property('count').equal(0);
    });

    it('should delete record in current domain', async () => {
      const status = await domainTest.deleteById(record1.id, ctx);
      status.should.have.property('count').equal(1);
    });

    it('should delete null-domain record', async () => {
      const status = await domainTest.deleteById(recordNull.id, ctx);
      status.should.have.property('count').equal(1);
    });

    it('should not delete record in another domain', async () => {
      const status = await domainTest.deleteById(record2.id, ctx);
      status.should.have.property('count').equal(0);
    });
  });
});
