const Joi = require('joi');
const validate = require('../utils/validateSchema');

module.exports = class UpdateAccountStringData {
  constructor({ accountDataConfig, accountDataRepo }) {
    this.accountDataRepo = accountDataRepo;
    this.accountDataConfig = accountDataConfig;

    // generate schema
    const keysAllowed = Object.keys(this.accountDataConfig)
      .filter(key => this.accountDataConfig[key].type === 'string')
      .reduce((acc, key) => {
        acc[key] = Joi.string();
        return acc;
      }, {});

    this.schema = Joi.object().keys({
      userID: Joi.string().required().label('User ID'),
      data: Joi.object().keys(keysAllowed),
    }).unknown();
  }

  async execute(req) {
    const { userID, data } = validate(this.schema, req);

    await this.accountDataRepo.update({ userID, data });
  }
};
