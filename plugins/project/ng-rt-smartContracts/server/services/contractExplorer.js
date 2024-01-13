"use strict";

const {
  getSCTabs,
  getFunctionAndArguments,
  findFunctionNodes,
  mapArgumentsForFunctions,
  getContractInfo,
  getNodesByFlowId,
  findIdOfGivenTemplate
} = require("./flowHelper");

const logger = require("log4js").getLogger("server.services.contractExplorer");

let nodeRedService;
let scService;
let models;
let defaultDs;

const getFlows = () => {
  try {
    const flows = nodeRedService.RED.nodes.getFlows().flows;
    return flows;
  } catch (error) {
    logger.error(error.message);
  }
};
const fetchContractDetails = async contractId => {
  try {
    const contractDetail = await models.scTemplate.find({
      where: {
        address: contractId
      }
    });
    if (contractDetail.length > 0) return contractDetail[0];
    throw new Error("Contract detail not found!");
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};
/**
 * The details of the contract instance.
 * @typedef {Object} contractInstanceDetails
 * @property {string} contractDescription - Description of the contract instance.
 * @property {Array} contractOwner - Array of public keys.
 * @property {Array} mappedFunctionsAndArguments - Array of functions and arguments.
 */

/**
 * Fetch contract instance details by providing the contractId
 * @param {string} contractId id of the contract instance/template
 * @return {contractInstanceDetails} Details of the given contractId
 */
const contractInstanceDetailsById = async contractId => {
  try {
    const contractDetail = await fetchContractDetails(contractId);
    const jsonSource = JSON.parse(contractDetail.source);
    const functionNodes = findFunctionNodes(jsonSource);
    const mappedFunctionsAndArguments = mapArgumentsForFunctions(
      functionNodes,
      jsonSource
    );
    const contractDescription = getContractInfo(jsonSource);
    return {
      contractDescription,
      publishedOn: contractDetail.createdOn,
      contractOwner: contractDetail.ownerPublicKeys,
      mappedFunctionsAndArguments
    };
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Fetches a list of currently deployed smart contract templates
 * @return {Array} An array of deployed smart contract templates
 */
const getContractTemplates = ({excludeTabName, includeNodeName}) => {
  try {
    const nodeRedNodes = getFlows();
    const contractTemplates = getSCTabs(nodeRedNodes, {
      excludeTabName,
      includeNodeName
    });
    return contractTemplates;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Details of a contract template.
 * @typedef {Object} contractTemplateDetails
 * @property {string} contractDescription - Description of the contract template.
 * @property {Array} mappedFunctionsAndArguments - Array of functions and arguments.
 */

/**
 * Fetches associated functions and arguments for a given template/contractId
 * @param {string} templateName Name of the template
 * @param {string} version Version of the template
 * @return {contractTemplateDetails} An Object of functions and arguments nodes
 */
const getContractTemplateDetails = (
  templateName,
  version,
  {includeNodeName, excludeTabName}
) => {
  try {
    const nodeRedNodes = getFlows();
    const SCtabs = getSCTabs(nodeRedNodes, {excludeTabName, includeNodeName});
    const flowId = findIdOfGivenTemplate(SCtabs, templateName, version);
    const currentTabNodes = getNodesByFlowId(nodeRedNodes, flowId);
    const mappedFunctionsAndArguments = getFunctionAndArguments(
      currentTabNodes
    );
    const contractDescription = getContractInfo(currentTabNodes);
    return {contractDescription, mappedFunctionsAndArguments};
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Fetches the state/memory of a contract from worldState for given contractId
 * @param {string} contractId Id of the smart contract instance
 * @return {object} Object containing the memory of the smart contract instance
 */
const contractStateById = async contractId => {
  try {
    const contractState = await scService.getMemory(models, contractId);
    return contractState;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

const fetchContractInstancesByTemplateName = async function(templateName) {
  try {
    const templateNode = await models.nodeRedFlow.find({
      where: {label: templateName}
    });
    const flowIdToMatch = '%\\"z\\":\\"' + templateNode[0].flowId + '\\"%';

    const publishedInstances = await models.scTemplate.find({
      where: {source: {like: flowIdToMatch}}
    });

    if (!templateNode || !publishedInstances) {
      throw new Error("No contract/instances found");
    }

    const contractInstances = publishedInstances.map(contractInstance => {
      return {
        contractId: contractInstance.txId,
        contractOwner: contractInstance.ownerPublicKeys,
        createdOn: contractInstance.createdOn
      };
    });
    return contractInstances;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};
/**
 * Contract instance by template name
 * @param {string} templateName Id of the smart contract instance
 * @return {object} Object containing the memory of the smart contract instance
 */
const contractInstanceByTemplateName = async templateName => {
  try {
    const contractInstances = await fetchContractInstancesByTemplateName(
      templateName
    );
    return contractInstances;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

const buildFilter = function(contractId, createdOn, owner) {
  let filterObj = {};
  if (contractId !== "") {
    Object.assign(filterObj, {address: contractId});
  }

  if (createdOn !== "") {
    Object.assign(filterObj, {createdOn});
  }

  if (owner !== "") {
    switch (defaultDs) {
      case ('mongodb'):
        Object.assign(filterObj, {ownerPublicKeys: owner});
        break;
      case ('postgresql'):
        Object.assign(filterObj, {ownerPublicKeys: {like: '%' + owner + '%'}});
        break;
      default:
        Object.assign(filterObj, {ownerPublicKeys: owner});
    }
  }
  return filterObj;
};

/**
 * @name fetchAllContractInstances
 * @param {number} limit number of blocks
 * @param {number} offset number of page
 * @param {string} sortBy ASC|DESC
 * @description Fetches all the instances of published contracts
 * @return {Array} list of contract instances
 */
const fetchAllContractInstances = async (
  limit,
  offset,
  sortBy,
  {contractId, owner, createdOn}
) => {
  try {
    const filter = {
      where: buildFilter(contractId, createdOn, owner),
      limit: limit,
      order: `createdOn ${sortBy}`,
      skip: offset
    };
    const publishedInstances = await models.scTemplate.find(filter);
    const contractInstances = publishedInstances.map(contractInstance => {
      return {
        contractId: contractInstance.txId,
        contractOwner: contractInstance.ownerPublicKeys,
        createdOn: contractInstance.createdOn
      };
    });
    return contractInstances;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

const findUserInfoByPublicKey = async publicKey => {
  try {
    let fullname = "";
    let type = "Unknown";
    const keyData = await models.publicKey.findOne({where: {key: publicKey}});
    if (keyData) {
      const platformUser = await models.user.findOne({where: {id: keyData.userId}});
      if (platformUser) {
        fullname = platformUser.fullname ? platformUser.fullname : fullname;
        type = "TBSP";
        if (platformUser.externalId !== null) {
          type = "External";
        }
      }
    }
    return {fullname, type};
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};
/**
 * A usrinfo object displaying the fullname and type.
 * @typedef {object} UserInfo User information
 * @param {string} Fullname Fullname of the user
 * @param {string} type type of user
 */
/**
 * Given a public key returns the user info
 *
 * @param {string} publicKey Public key to search the user
 * @return {UserInfo} User info object oneof: External/TBSP/Unknown
 *
 */
const getUserInformationByPublicKey = async publicKey => {
  try {
    if (publicKey === "") {
      throw new Error('Public key is mandatory');
    }
    const userInfo = await findUserInfoByPublicKey(publicKey);
    return userInfo;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

module.exports = (services, pluginSettings) => {
  try {
    nodeRedService = services.get("RED");
    models = services.get("loopbackApp").models;
    scService = require("./services/smartContract")(services);
    let configService = services.get('configService');
    defaultDs = configService.get('datasources.default.connector');

    return {
      contractInstanceDetailsById,
      getContractTemplates,
      getContractTemplateDetails,
      contractStateById,
      contractInstanceByTemplateName,
      fetchAllContractInstances,
      getUserInformationByPublicKey
    };
  } catch (error) {
    logger.error(error.message);
    throw Error("Error occured in contract explorer");
  }
};
