const Joi = require('@hapi/joi');
const validate = require('../utils/validateSchema');

module.exports = class GetAccountData {
  constructor({ accountDataConfig, dataTypeServices }) {
    this.accountDataConfig = accountDataConfig;
    this.dataTypeServices = dataTypeServices;

    // generate schema
    const keysAllowed = Object.keys(this.accountDataConfig);
    const keySchema = Joi
      .alternatives()
      .when(Joi.string().valid(keysAllowed), {
        then: Joi.string().valid(keysAllowed),
        otherwise: Joi.object().keys({
          key: Joi.string().valid(keysAllowed).label('Key'),
        }).unknown(),
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

    const splitData = splitDataByKeyType(this.accountDataConfig, data);
    const accountData = await Promise.all(splitData.map(async (item) => {
      const fetchService = this.dataTypeServices[item.type];
      return fetchService(item);
    }));

    return mergeDataByUser(accountData);
  }
};

function splitDataByKeyType(dataConfig, data) {
  return data.reduce((newData, { userID, keys }) => {
    const groupedKeys = keys.reduce((acc, keyItem) => {
      const key = keyItem.key ? keyItem.key : keyItem;
      const { type } = dataConfig[key];
      acc[type] = acc[type] || [];
      acc[type].push(keyItem);
      return acc;
    }, {});

    const splitData = Object
      .keys(groupedKeys)
      .map(key => Object.assign({}, { userID, type: key, keys: groupedKeys[key] }));

    newData.push(...splitData);

    return newData;
  }, []);
}

function mergeDataByUser(splitData) {
  const userIndexCache = {};
  return splitData.reduce((acc, { userID, data }) => {
    const index = userIndexCache[userID];
    if (index >= 0) {
      acc[index].data = { ...acc[index].data, ...data };
    } else {
      acc.push({ userID, data });
      userIndexCache[userID] = acc.length - 1;
    }

    return acc;
  }, []);
}
