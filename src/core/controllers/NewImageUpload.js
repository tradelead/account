const Joi = require('@hapi/joi');
const validate = require('../utils/validateSchema');

module.exports = class NewImageUpload {
  constructor({ deleteAccountImageData, updateAccountImageData }) {
    this.deleteAccountImageData = deleteAccountImageData;
    this.updateAccountImageData = updateAccountImageData;

    this.schema = Joi.object().keys({
      userID: Joi.string().required().label('User ID'),
      key: Joi.string().required().label('Key'),
      url: Joi.string().required().label('URL'),
    });
  }

  async execute(req) {
    const { userID, key, url } = validate(this.schema, req);

    // delete all image key data for all sizes
    await this.deleteAccountImageData.execute({ userID, key });

    const data = {};
    data[key] = { url };
    await this.updateAccountImageData.execute({ userID, data });
  }
};
