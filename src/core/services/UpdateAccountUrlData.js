const Joi = require('@hapi/joi');
const tldjs = require('tldjs');
const validDomain = require('is-valid-domain');
const validate = require('../utils/validateSchema');

module.exports = class UpdateAccountUrlData {
  constructor({ accountDataConfig, accountDataRepo }) {
    this.accountDataRepo = accountDataRepo;
    this.accountDataConfig = accountDataConfig;

    // generate schema
    const keysAllowed = Object.keys(this.accountDataConfig)
      .filter(key => this.accountDataConfig[key].type === 'url')
      .reduce((acc, key) => {
        acc[key] = Joi.string().allow('');
        return acc;
      }, {});

    this.schema = Joi.object().keys({
      userID: Joi.string().required().label('User ID'),
      data: Joi.object().keys(keysAllowed),
    }).unknown();
  }

  async execute(req) {
    const { userID, data } = validate(this.schema, req);

    const sanitizedData = Object.assign({}, data);

    Object.keys(sanitizedData).forEach((key) => {
      const value = sanitizedData[key];

      const { error } = Joi.string().uri().allow('').validate(value);
      if (!error) {
        return;
      }

      if (isValidDomain(value)) {
        sanitizedData[key] = `http://${sanitizedData[key]}`;
        return;
      }

      const err = new Error(`"${key}" must be valid domain or url.`);
      err.name = 'BadRequest';
      throw err;
    });

    await this.accountDataRepo.update({ userID, data: sanitizedData });
  }
};


function isValidDomain(domain) {
  if (!validDomain(domain)) {
    return false;
  }

  return tldjs.tldExists(domain);
}
