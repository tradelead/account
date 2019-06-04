const Joi = require('@hapi/joi');
const validate = require('../utils/validateSchema');

module.exports = class GetAccountUrlData {
  constructor({ accountDataConfig, accountDataRepo }) {
    this.accountDataConfig = accountDataConfig;
    this.accountDataRepo = accountDataRepo;

    // generate schema
    const keysAllowed = Object.keys(this.accountDataConfig)
      .filter(key => this.accountDataConfig[key].type === 'url');

    this.schema = Joi.object().keys({
      userID: Joi.string().required().label('User ID'),
      keys: Joi.array().items(Joi.string().valid(keysAllowed).label('Keys')),
    }).unknown();
  }

  async execute(req) {
    const data = validate(this.schema, req);
    return this.accountDataRepo.get(data);
  }
};
