'use strict';

class DependenciesCheckError {
  constructor(code, message) {
    this._code = code;
    this._message = message;
  }

  get code() {
    return this._code;
  }

  get message() {
    return this._message;
  }

  addMessage(additionalMessage) {
    this._message = `${this._message} (${additionalMessage})`;
  }
}

module.exports = DependenciesCheckError;
