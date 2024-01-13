'use strict';

module.exports = model => {
  const self = this;
  this.model = model;
  return {
    getRoleByName: name => {
      return new Promise((resolve, reject) => {
        self.model.find({
          where: {name: name}
        }, (err, roles) => {
          if (err) return reject(err);
          if (roles && roles.length > 0) {
            return resolve(roles[0]);
          }
          resolve(null);
        });
      });
    }
  };
};
