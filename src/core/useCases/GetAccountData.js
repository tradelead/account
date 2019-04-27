const Joi = require('joi');
const validate = require('../utils/validateSchema');

module.exports = class GetAccountData {
  constructor({ accountDataConfig, accountDataRepo }) {
    this.accountDataConfig = accountDataConfig;
    this.accountDataRepo = accountDataRepo;

    const keysAllowed = this.accountDataConfig.map(item => item.key);
    const keySchema = Joi
      .alternatives()
      .when(Joi.string().valid(keysAllowed), {
        then: Joi.string().valid(keysAllowed),
        otherwise: Joi.object().keys({
          key: Joi.string().valid(keysAllowed).label('Key'),
          size: Joi.string().label('Size'), // for image type
        }),
      });

    this.schema = Joi.object().keys({
      data: Joi.array().items(Joi.object().keys({
        userID: Joi.string().required().label('User ID'),
        keys: Joi.array().items(keySchema).label('Keys'),
      }).unknown()).label('Data'),
    });
  }


  async execute(req) {
    const { data } = validate(this.schema, req);

    return this.accountDataRepo.getAccountData(data);
  }
};
