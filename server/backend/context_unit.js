// /**
//  * Test context.js
//  */
"use strict";

const sinonChai = require("sinon-chai");
const chai = require("chai");
chai.should();
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;

const context = require("./context");

describe("context", () => {
  it("Exports all functions", () => {
    expect(context.get).to.be.a("function");
    expect(context.set).to.be.a("function");
    expect(context.getAll).to.be.a("function");
    expect(context.scope).to.be.a("function");
    expect(context.scopePromise).to.be.a("function");
  });

  it("Does not get any context if not set", () => {
    const contextKey = "user";
    const userCtx = context.get(contextKey);
    expect(userCtx).to.be.equal(undefined);
  });

  it("Throws error if set function is =called before scoping", () => {
    const key = "user";
    const value = {
      domainId: "D01"
    };
    let err =
      "No context available. ns.run() or ns.bind() must be called first.";
    expect(() => {
      context.set(key, value);
    }).to.throw(err);
  });

  it("Scopes a user context sync", () => {
    const ctxInitValues = {
      user: {
        domainId: "D01"
      }
    };

    context.scope(() => {
      expect(context.get("user")).to.be.equal(ctxInitValues.user);
    }, ctxInitValues);
  });

  it("Scopes a user context async", async() => {
    const ctxInitValues = {
      user: {
        domainId: "D01"
      }
    };
    (async() => {
      await context.scopePromise(async() => {
        await expect(context.get("user")).to.be.equal(ctxInitValues.user);
      }, ctxInitValues);
    })();
  });

  it("Scopes multiple contexts", async() => {
    const ctxInitValues = {
      user: {
        domainId: "D01"
      },
      requestId: "requestId",
      sessionId: "sessionId"
    };

    return context.scope(() => {
      expect(context.getAll()).to.be.equal(ctxInitValues);
    }, ctxInitValues);
  });

  it("Scopes multiple contexts Async", async() => {
    const ctxInitValues = {
      user: {
        domainId: "D01"
      },
      requestId: "requestId",
      sessionId: "sessionId",
      clientId: "clientId"
    };

    context.scopePromise(async() => {
      await expect(context.getAll()).to.be.equal(ctxInitValues);
    }, ctxInitValues);
  });
});
