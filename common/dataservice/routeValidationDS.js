/**
 *  Loopback function definitions for route Validation using joi
 */
'use strict';

const logger = require('log4js').getLogger('common.dataservice.routeValidation');

/**
 *
 * @param {*} model the request object
 * @param {*} routeValidation the name of the model
 * @description create routeValidation model in DB
 */
function create(model, routeValidation) {
  logger.trace('execute common.dataservice.routeValidation');
  logger.debug('model :', model);

  let route = routeValidation.route;
  let method = routeValidation.method;
  let validation = routeValidation.validation;
  let recordStatus = 'a';

  model.create({
    route,
    method,
    validation,
    recordStatus
  });
}

/**
 *
 * @param {*} model the request object
 * @description update routeValidation model in DB
 */
function update(model) {
  // model.updateAttribute();
  return;
}

/**
 *
 * @param {*} model name of the model
 * @param {*} id Id of the record
 * @return {*} model the record of the model
 * @description destroy routeValidation entry in DB based on ID
 */
function deletebyID(model, id) { // destroy
  return model.destroyById(id);
}

/**
 *
 * @param {*} model the request object
 * @return {*} model the record of the model
 * @description delete all routeValidation entries in DB
 */
function deleteAllData(model) { // destroyall
  return model.destroyAll({
    where: {}
  });
}
/**
 *
 * @param {*} model name of the model
 * @param {*} route name of the Route
 * @param {*} method name of the method (get, post, delete ....)
 * @return {*} model the record of the model
 * @description find specific routeValidation entry via unique route and method
 */
function findOne(model, route, method) { // findOne and find/findbyID
  return new Promise((resolve, reject) => {
    model.findOne({
      where: {and: [{route: route}, {method: method}]}
    })
    .then(result => {
      logger.trace('result: ', result);
      if (result !== null) {
        logger.trace('route and method found');
        return resolve(result);
      }
      logger.trace('route not found');
      return resolve(null);
    })
    .catch(function(err) {
      logger.error('Error :', err);
      return reject();
    });
  });
}

module.exports = {
  create,
  update,
  findOne,
  deletebyID,
  deleteAllData
};
