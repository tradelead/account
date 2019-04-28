const Joi = require('joi');
const validate = require('../utils/validateSchema');

module.exports = class UpdateAccountData {
  constructor({ accountDataConfig, dataTypeServices }) {
    this.accountDataConfig = accountDataConfig;
    this.dataTypeServices = dataTypeServices;

    this.schema = Joi.object().keys({
      auth: Joi.object().keys({
        id: Joi.string().label('Auth User ID'),
        roles: Joi.array().items(Joi.string()),
      }).unknown().allow(null, false),
      userID: Joi.string().required().label('User ID'),
      data: Joi.object().required(),
    });
  }

  async execute(req) {
    const { auth, userID, data } = validate(this.schema, req);

    if (!auth || auth.id !== userID) {
      throw new Error('Invalid permissions');
    }

    const splitData = splitDataByKeyType(this.accountDataConfig, data);

    await Promise.all(Object.keys(splitData).map(async (type) => {
      const updateService = this.dataTypeServices[type];
      return updateService({ userID, data: splitData[type] });
    }));
  }
};

function splitDataByKeyType(dataConfig, data) {
  return Object.keys(data).reduce((acc, key) => {
    const { type } = dataConfig[key];
    acc[type] = acc[type] || {};
    acc[type][key] = data[key];

    return acc;
  }, {});
}
