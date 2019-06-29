const Joi = require('@hapi/joi');
const validate = require('../utils/validateSchema');

module.exports = class GetExchangeKeys {
  constructor({ exchangeKeysRepo }) {
    this.exchangeKeysRepo = exchangeKeysRepo;

    this.schema = Joi.object().keys({
      auth: Joi.object().keys({
        id: Joi.string().label('Auth User ID'),
        roles: Joi.array().items(Joi.string()),
      }).unknown().allow(null, false),
      userID: Joi.string().required().label('User ID'),
      exchangeIDs: Joi.array()
        .items(Joi.string().required().label('Exchange ID'))
        .label('Exchange IDs'),
    });
  }

  async execute(req) {
    const {
      auth,
      userID,
      exchangeIDs,
    } = validate(this.schema, req);

    const isOwner = auth && auth.id === userID;
    const isSystem = auth && auth.roles && auth.roles.includes('system');
    if (!auth || (!isOwner && !isSystem)) {
      throw new Error('Invalid permissions');
    }

    return this.exchangeKeysRepo.get({
      userID,
      exchangeIDs,
      decrypt: isSystem === true,
    });
  }
};
