"use strict";

const chai = require("chai");
// const assert = require('chai').assert;
const expect = chai.expect;
const request = require("request");
const nock = require("nock");
const response = require("../../test/test");

chai.should();

const templateName = "SC_HelloWorld_Part2";
const pubKey = "2SRYD7njZV28cWtN8b6hioDrftUXKemDY6v2wuoWZrAW";
const contractId =
  "2ea98b8dc84c186883b67694743361f2018803ee8a556372dfaae249a8446e3d";
const getGreeting = "getGreeting";

describe("routes unite tests", () => {
  describe("server POST request for Publish", () => {
    nock("http://localhost:8443")
      .put(`/ng-rt-smartContracts/contracts/app/${templateName}`)
      .reply(200, response.responsePublish);

    it("should return code 200 with success Json", done => {
      const options = {
        method: "put",
        url: `http://localhost:8443/ng-rt-smartContracts/contracts/app/${templateName}`,
        pubKey: pubKey
      };
      request(options, (err, res, body) => {
        if (res) {
          body = JSON.parse(res.body);
          expect(body.operation).to.equal("CREATE");
          expect(body.outputs[0].public_keys[0]).to.equal(
            "2SRYD7njZV28cWtN8b6hioDrftUXKemDY6v2wuoWZrAW"
          );
          // expect().to.not.be.null;
        }
        done();
      });
    });

    it("should return missing flow message", done => {
      const options = {
        method: "put",
        url: `http://localhost:8443/ng-rt-smartContracts/contracts/app/SC_HelloWorld_Part22`,
        pubKey: pubKey
      };
      request(options, (err, res, body) => {
        if (res) expect(body).to.equal("No such flow !!");
        done();
      });
    });
  });

  describe("server POST request for call", () => {
    nock("http://localhost:8443")
      .post(
        `/ng-rt-smartContracts/contracts/app/call/${contractId}/${getGreeting}`
      )
      .reply(200, {
        result: "hello"
      });

    nock("http://localhost:8443")
      .post(
        `/ng-rt-smartContracts/contracts/app/call/${contractId}/getGreetingg`
      )
      .reply(200, {
        msg: "Error: method not exist"
      });

    it("should return contract memory for the mentioned contractId", done => {
      const options = {
        method: "post",
        url: `http://localhost:8443/ng-rt-smartContracts/contracts/app/call/${contractId}/${getGreeting}`,
        pubKey: pubKey
      };
      /* eslint-disable handle-callback-err */
      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        expect(typeof body).to.equal("string");
        done();
      });
    });

    it("should return method not exist error", done => {
      const options = {
        method: "post",
        url: `http://localhost:8443/ng-rt-smartContracts/contracts/app/call/${contractId}/getGreetingg`,
        pubKey: pubKey
      };
      request(options, (err, res, body) => {
        body = JSON.parse(body);
        if (res) expect(body.msg).to.equal("Error: method not exist");
        done();
      });
    });
  });

  describe("server POST request for transfer", () => {
    nock("http://localhost:8443")
      .post(
        `/ng-rt-smartContracts/contracts/app/transferCall/f34d691f08a9af071630b0bd9bf335d4c80c0a890e9ff9490e3673f270065667/transferVehicle`
      )
      .reply(200, response.transferResult);

    it("should return code 200 with successful transfer", done => {
      const options = {
        method: "post",
        url: `http://localhost:8443/ng-rt-smartContracts/contracts/app/transferCall/f34d691f08a9af071630b0bd9bf335d4c80c0a890e9ff9490e3673f270065667/transferVehicle`,
        pubKey: "D5wUunZ7AgDN1f5K42puUj6mqj5LFCunjVwxRzLEBnGW"
      };
      request(options, (err, res, body) => {
        body = JSON.parse(body);
        expect(body.result).to.equal("Please go ahead with transfer!!!");
        expect(body.transferTxId.operation).to.equal("TRANSFER");
        expect(body.transferTxId.outputs[0].public_keys[0]).to.equal(
          "BC7WGR8i6Z1vYjPd5xxEmr8uAo9r3BUmCFLfLr6j35v"
        );
        expect(body.transferTxId.inputs[0].owners_before[0]).to.equal(
          "D5wUunZ7AgDN1f5K42puUj6mqj5LFCunjVwxRzLEBnGW"
        );

        done();
      });
    });
  });

  describe("server POST request for checkTx", () => {
    nock("http://localhost:8443")
      .post(`/ng-rt-smartContracts/consensus/checkTx`)
      .reply(200, "NEXT");

    it("should return NEXT if consensus check is successful", done => {
      const options = {
        method: "post",
        url: `http://localhost:8443/ng-rt-smartContracts/consensus/checkTx`
      };
      // const data =  {"data":{"id":"9accc5057343ed55e5761ebb959b64d4822716f1e6c2c9a5ac51850756cfedda","operation":"CREATE","outputs":[{"condition":{"details":{"type":"ed25519-sha-256","public_key":"D5wUunZ7AgDN1f5K42puUj6mqj5LFCunjVwxRzLEBnGW"},"uri":"ni:///sha-256;mQ1uhqKsELggBWzV21An9wjzmM9vlntSrD2WMl4kGEs?fpt=ed25519-sha-256&cost=131072"},"amount":"1","public_keys":["D5wUunZ7AgDN1f5K42puUj6mqj5LFCunjVwxRzLEBnGW"]}],"inputs":[{"fulfillment":"pGSAILOQKx-hGBcZvyDKQRdxcyKx85cQR_dTQaQ8sflWnkBXgUDMLJDj9z2LhxqLTa16_vCOvnq_IikGsKRur1BFEk_6fzyABk7hXSzBWLfxMtt0izH2ftlOABIupk6IiFH9YY0J","fulfills":null,"owners_before":["D5wUunZ7AgDN1f5K42puUj6mqj5LFCunjVwxRzLEBnGW"]}],"metadata":{},"asset":{"data":{"contractCreation":{"source":"[{\"id\":\"7f2cb033.01e6\",\"type\":\"set-memory-field\",\"z\":\"c32b9969.c52b08\",\"name\":\"set memory field\",\"field\":\"greeting\",\"source\":\"greeting\",\"x\":990,\"y\":600,\"wires\":[[\"64017be5.8ea514\"]]},{\"id\":\"73a952e.e78e3ac\",\"type\":\"arguments\",\"z\":\"c32b9969.c52b08\",\"name\":\"get argument \\\"greeting\\\"\",\"position\":0,\"destination\":\"greeting\",\"x\":730,\"y\":600,\"wires\":[[\"7f2cb033.01e6\"]]},{\"id\":\"c21832b.cf023d\",\"type\":\"smartContract-v1.0\",\"z\":\"c32b9969.c52b08\",\"name\":\"smartContract-v1.0\",\"x\":490,\"y\":180,\"wires\":[]},{\"id\":\"a7513ca1.e6024\",\"type\":\"set-memory-field\",\"z\":\"c32b9969.c52b08\",\"name\":\"set memory field\",\"field\":\"greeting\",\"source\":\"greeting\",\"x\":990,\"y\":360,\"wires\":[[\"80c623a2.d60df\"]]},{\"id\":\"716dc22c.595bec\",\"type\":\"contract in\",\"z\":\"c32b9969.c52b08\",\"name\":\"changeGreeting\",\"url\":\"/changeGreeting\",\"method\":\"get\",\"swaggerDoc\":\"\",\"x\":480,\"y\":600,\"wires\":[[\"73a952e.e78e3ac\"]]},{\"id\":\"80c623a2.d60df\",\"type\":\"done\",\"z\":\"c32b9969.c52b08\",\"name\":\"Published successfully\",\"x\":1240,\"y\":360,\"wires\":[]},{\"id\":\"453f3b83.63ea64\",\"type\":\"comment\",\"z\":\"c32b9969.c52b08\",\"name\":\"SC_HelloWorld_Part2\",\"info\":\"Saving data to memory.\\n\\nReading from memory.\\n\\nUpdating the state.\",\"x\":860,\"y\":180,\"wires\":[]},{\"id\":\"99897445.b88458\",\"type\":\"get-memory-field\",\"z\":\"c32b9969.c52b08\",\"name\":\"get memory field\",\"field\":\"greeting\",\"destination\":\"payload\",\"x\":720,\"y\":480,\"wires\":[[\"c39273bf.103a3\"]]},{\"id\":\"64017be5.8ea514\",\"type\":\"done\",\"z\":\"c32b9969.c52b08\",\"name\":\"done with greeting changes\",\"x\":1260,\"y\":600,\"wires\":[]},{\"id\":\"58d3fb3f.164bb4\",\"type\":\"contract in\",\"z\":\"c32b9969.c52b08\",\"name\":\"init\",\"url\":\"/helloWorld_Part2\",\"method\":\"get\",\"swaggerDoc\":\"\",\"x\":450,\"y\":360,\"wires\":[[\"4346cce2.9e7904\"]]},{\"id\":\"e5d596ad.fd6b48\",\"type\":\"contract in\",\"z\":\"c32b9969.c52b08\",\"name\":\"getGreeting\",\"url\":\"/getGreeting\",\"method\":\"get\",\"swaggerDoc\":\"\",\"x\":470,\"y\":480,\"wires\":[[\"99897445.b88458\"]]},{\"id\":\"4346cce2.9e7904\",\"type\":\"arguments\",\"z\":\"c32b9969.c52b08\",\"name\":\"get argument \\\"greeting\\\"\",\"position\":0,\"destination\":\"greeting\",\"x\":730,\"y\":360,\"wires\":[[\"a7513ca1.e6024\"]]},{\"id\":\"c39273bf.103a3\",\"type\":\"done\",\"z\":\"c32b9969.c52b08\",\"name\":\"done\",\"x\":950,\"y\":480,\"wires\":[]}]","memory":{"greeting":"heyyyy"},"sourceHash":"65fb114bfa3f9e256757f37a15bbfe49","hashRandomizer":"9bdaw"}}},"version":"2.0"}};

      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        expect(body).to.equal("NEXT");
        done();
      });
    });
  });

  describe("server POST request for deliverTx", () => {
    nock("http://localhost:8443")
      .post(`/ng-rt-smartContracts/consensus/deliverTx`)
      .reply(200, "ALLOW");

    it("should return ALLOW", done => {
      const options = {
        method: "post",
        url: `http://localhost:8443/ng-rt-smartContracts/consensus/deliverTx`
      };

      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        expect(body).to.equal("ALLOW");
        done();
      });
    });
  });

  describe("server GET request for config", () => {
    nock("http://localhost:8443")
      .get(`/ng-rt-smartContracts/config`)
      .reply(200, "ALLOW");

    it("should return ALLOW", done => {
      const options = {
        method: "get",
        url: `http://localhost:8443/ng-rt-smartContracts/config`
      };

      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        expect(body).to.equal("ALLOW");
        done();
      });
    });
  });

  describe("Smart Contract explorer", () => {
    const scExplorerTestData = require("../../test/testData");
    it("should return all contract templates", done => {
      const templateLists = scExplorerTestData.contractTemplates;
      nock("http://localhost:8443")
        .get(`/ng-rt-smartContracts/contract-templates`)
        .reply(200, templateLists);

      const options = {
        method: "get",
        url: "http://localhost:8443/ng-rt-smartContracts/contract-templates"
      };
      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        expect(body).to.equal(JSON.stringify(templateLists));
        done();
      });
    });

    it("should return contract template details for 'SCHelloWorld_Part1'", done => {
      const SCHelloWorldPart1Functions =
        scExplorerTestData.SCHelloWorldPart1Functions;
      const templateName = "SC_HelloWorld_Part3";
      nock("http://localhost:8443")
        .get("/ng-rt-smartContracts/contract-templates/" + templateName)
        .reply(200, SCHelloWorldPart1Functions);
      const options = {
        method: "get",
        url:
          "http://localhost:8443/ng-rt-smartContracts/contract-templates/" +
          templateName
      };
      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        expect(body).to.equal(JSON.stringify(SCHelloWorldPart1Functions));
        done();
      });
    });

    it("should return contract instance details for given contract id", done => {
      const SCHelloWorldPart1ContractId = "somecontractid";
      const SCHelloWorldPart1InstanceDetails =
        scExplorerTestData.SCHelloWorldPart1InstanceDetails;
      nock("http://localhost:8443")
        .get("/ng-rt-smartContracts/contracts/" + SCHelloWorldPart1ContractId)
        .reply(200, SCHelloWorldPart1InstanceDetails);

      const options = {
        method: "get",
        url:
          "http://localhost:8443/ng-rt-smartContracts/contracts/" +
          SCHelloWorldPart1ContractId
      };
      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        expect(body).to.equal(JSON.stringify(SCHelloWorldPart1InstanceDetails));
        done();
      });
    });

    it("should return state of a contract instance", done => {
      const SCHelloWorldPart1ContractId = "somecontractid";
      const state = scExplorerTestData.ScHwP1_memory;
      nock("http://localhost:8443")
        .get(
          "/ng-rt-smartContracts/contracts/" +
            SCHelloWorldPart1ContractId +
            "/state"
        )
        .reply(200, state);

      const options = {
        method: "get",
        url:
          "http://localhost:8443/ng-rt-smartContracts/contracts/" +
          SCHelloWorldPart1ContractId +
          "/state"
      };
      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        expect(body).to.equal(JSON.stringify(state));
        done();
      });
    });

    it("should return instances for given templateName", done => {
      const templateName = "SC_HelloWorld_Part1";
      const instances = ["contractHash1", "contractHash2", "contractHash3"];
      nock("http://localhost:8443")
        .get("/ng-rt-smartContracts/contracts/" + templateName + "/instances")
        .reply(200, instances);

      const options = {
        method: "get",
        url:
          "http://localhost:8443/ng-rt-smartContracts/contracts/" +
          templateName +
          "/instances"
      };
      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        expect(body).to.equal(JSON.stringify(instances));
        done();
      });
    });
  });
});
