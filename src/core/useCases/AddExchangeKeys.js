const Joi = require('joi');
const validate = require('../utils/validateSchema');

module.exports = class AddExchangeKeys {
  constructor({ exchangeKeysRepo, events }) {
    this.exchangeKeysRepo = exchangeKeysRepo;
    this.events = events;

    this.schema = Joi.object().keys({
      auth: Joi.object().keys({
        id: Joi.string().label('Auth User ID'),
        roles: Joi.array().items(Joi.string()),
      }).unknown().allow(null, false),
      userID: Joi.string().required().label('User ID'),
      exchangeID: Joi.string().required().label('Exchange ID'),
      token: Joi.string().required().label('Token'),
      secret: Joi.string().required().label('Secret'),
    });
  }

  async execute(req) {
    const {
      auth,
      userID,
      exchangeID,
      token,
      secret,
    } = validate(this.schema, req);

    const isOwner = auth && auth.id === userID;
    if (!auth || !isOwner) {
      throw new Error('Invalid permissions');
    }

    await this.exchangeKeysRepo.add({
      userID,
      exchangeID,
      token,
      secret,
    });

    this.events.emit('addedExchangeKeys', { userID, exchangeID });

    return true;
  }
};
