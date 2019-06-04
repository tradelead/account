const Joi = require('@hapi/joi');
const validate = require('../utils/validateSchema');

module.exports = class GetAccountData {
  constructor({ accountDataConfig, uploadSigner }) {
    this.accountDataConfig = accountDataConfig;
    this.uploadSigner = uploadSigner;

    this.schema = Joi.object().keys({
      auth: Joi.object().keys({
        id: Joi.string().label('Auth User ID'),
        roles: Joi.array().items(Joi.string()),
      }).unknown().allow(null, false),
      userID: Joi.string().required().label('User ID'),
      key: Joi.string().required().label('Key'),
    });
  }

  async execute(req) {
    const data = validate(this.schema, req);

    if (!data.auth || data.auth.id !== data.userID) {
      throw new Error('Invalid permissions');
    }

    const { types } = this.accountDataConfig[data.key];

    return this.uploadSigner.execute({ ...data, types });
  }
};
