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
    });
  }

  async execute(req) {
    const {
      auth,
      userID,
      exchangeID,
    } = validate(this.schema, req);

    const isOwner = auth && auth.id === userID;
    if (!auth || !isOwner) {
      throw new Error('Invalid permissions');
    }

    await this.exchangeKeysRepo.delete({
      userID,
      exchangeID,
    });

    this.events.emit('deletedExchangeKeys', { userID, exchangeID });

    return true;
  }
};
