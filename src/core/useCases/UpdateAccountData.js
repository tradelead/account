const Joi = require('joi');
const validate = require('../utils/validateSchema');

module.exports = class UpdateAccountData {
  constructor({ accountDataConfig, accountDataRepo }) {
    this.accountDataConfig = accountDataConfig;
    this.accountDataRepo = accountDataRepo;
    this.schema = Joi.object().keys({
      auth: Joi.object().keys({
        id: Joi.string().label('Auth User ID'),
        roles: Joi.array().items(Joi.string()),
      }).unknown().allow(null, false),
      userID: Joi.string().required().label('User ID'),
      data: generateSchema(this.accountDataConfig),
    });
  }

  async execute(req) {
    const { auth, userID, data } = validate(this.schema, req);

    if (!auth || auth.id !== userID) {
      throw new Error('Invalid permissions');
    }

    await this.accountDataRepo.updateAccountData({ userID, data });
  }
};

function generateSchema(accountDataConfig) {
  const dataSchemaKeys = {};
  accountDataConfig.forEach((item) => {
    if (item.type === 'string') {
      dataSchemaKeys[item.key] = Joi.string();
    }
  });

  return Joi.object().keys(dataSchemaKeys);
}
