const Joi = require('joi');
const validate = require('../utils/validateSchema');

module.exports = class GetAccountStringData {
  constructor({ accountDataConfig, accountDataRepo }) {
    this.accountDataConfig = accountDataConfig;
    this.accountDataRepo = accountDataRepo;

    // generate schema
    const keysAllowed = Object.keys(this.accountDataConfig)
      .filter(key => this.accountDataConfig[key].type === 'string');

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
