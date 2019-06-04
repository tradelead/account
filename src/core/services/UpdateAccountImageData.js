const Joi = require('@hapi/joi');
const probe = require('probe-image-size');
const validate = require('../utils/validateSchema');

module.exports = class UpdateAccountImageData {
  constructor({ accountDataConfig, accountDataRepo }) {
    this.accountDataRepo = accountDataRepo;
    this.accountDataConfig = accountDataConfig;

    // generate schema
    const keysAllowed = Object.keys(this.accountDataConfig)
      .filter(key => this.accountDataConfig[key].type === 'image')
      .reduce((acc, key) => {
        acc[key] = Joi.object().keys({
          url: Joi.string().required(),
          size: Joi.string().valid(Object.keys(this.accountDataConfig[key].sizes)),
        });
        return acc;
      }, {});

    this.schema = Joi.object().keys({
      userID: Joi.string().required().label('User ID'),
      data: Joi.object().keys(keysAllowed),
    }).unknown();
  }

  async execute(req) {
    const { userID, data } = validate(this.schema, req);

    await Promise.all(Object.keys(data).map(async (key) => {
      const obj = data[key];
      const meta = await getImageMeta(obj.url);
      data[key].height = meta.height;
      data[key].width = meta.width;
    }));

    const serializedData = serializeData(data);
    await this.accountDataRepo.update({ userID, data: serializedData });
  }
};

async function getImageMeta(url) {
  return probe(url);
}

function serializeData(data) {
  const newData = {};
  Object.keys(data).forEach((rootKey) => {
    const obj = data[rootKey];
    const imageKey = `${rootKey}-${obj.size || 'orig'}`;
    Object.keys(obj).forEach((key) => {
      newData[`${imageKey}-${key}`] = obj[key];
    });
  });
  return newData;
}
