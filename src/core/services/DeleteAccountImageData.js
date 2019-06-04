const Joi = require('@hapi/joi');
const validate = require('../utils/validateSchema');

module.exports = class DeleteAccountImageData {
  constructor({ accountDataConfig, accountDataRepo }) {
    this.accountDataRepo = accountDataRepo;
    this.accountDataConfig = accountDataConfig;

    // generate schema
    const keysAllowed = Object.keys(this.accountDataConfig)
      .filter(key => this.accountDataConfig[key].type === 'image');

    this.schema = Joi.object().keys({
      userID: Joi.string().required().label('User ID'),
      key: Joi.string().valid(keysAllowed),
    }).unknown();
  }

  async execute(req) {
    const { userID, key } = validate(this.schema, req);

    await this.accountDataRepo.delete({ userID, rootKey: key });
  }
};
