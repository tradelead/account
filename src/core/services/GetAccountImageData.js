const Joi = require('@hapi/joi');
const fetch = require('node-fetch');
const sharp = require('sharp');
const urlUtil = require('url');
const validate = require('../utils/validateSchema');

module.exports = class GetAccountImageData {
  constructor({
    accountDataConfig,
    accountDataRepo,
    saveFile,
    updateAccountImageData,
  }) {
    this.accountDataConfig = accountDataConfig;
    this.accountDataRepo = accountDataRepo;
    this.saveFile = saveFile;
    this.updateAccountImageData = updateAccountImageData;

    // generate schema
    const keysAllowed = Object.keys(this.accountDataConfig);

    this.schema = Joi.object().keys({
      userID: Joi.string().required().label('User ID'),
      keys: Joi.array().items(Joi.object().keys({
        key: Joi.string().valid(keysAllowed).label('Key'),
        size: Joi.string().label('Size'), // for image type
      })),
    }).unknown();
  }

  async execute(req) {
    const data = validate(this.schema, req);

    const serializeData = serializeImageKeys(data);

    const accountData = await this.accountDataRepo.get(serializeData);

    const deserializeData = deserializeImageData(accountData, data);

    return resizeImages.call(this, { accountData: deserializeData, orig: data });
  }
};

function serializeImageKeys(data) {
  const newData = Object.assign({}, data);
  newData.keys = data.keys.reduce((acc, item) => {
    const newItem = Object.assign({}, item);
    const key = serializeImageKey(newItem);
    const origKey = serializeImageKey(Object.assign({}, newItem, { size: undefined }));
    acc.push(...imageKeys(key), ...imageKeys(origKey));
    return acc;
  }, []);
  return newData;
}

function imageKeys(rootKey) {
  return [
    `${rootKey}-url`,
    `${rootKey}-width`,
    `${rootKey}-height`,
  ];
}

function serializeImageKey(item) {
  return `${item.key}-${item.size || 'orig'}`;
}

function deserializeImageData(accountData, origData) {
  if (!accountData.data) { return accountData; }
  const newAccountData = Object.assign({}, accountData);

  let newData = {};
  origData.keys.forEach((obj) => {
    const rootKey = serializeImageKey(obj);
    const keys = imageKeys(rootKey);

    const deserialize = (itemObj, itemRootKey) => (acc, key) => {
      acc[obj.key] = acc[itemObj.key] || { size: itemObj.size };
      const propertyName = key.replace(`${itemRootKey}-`, '');

      let value = accountData.data[key];
      if (propertyName === 'height' || propertyName === 'width') {
        value = parseInt(value, 10);
      }

      acc[obj.key][propertyName] = value;
      return acc;
    };

    const newObj = (keys.reduce(deserialize(obj, rootKey), {}));

    if (obj.size) {
      const origObj = Object.assign({}, obj, { size: undefined });
      const origRootKey = serializeImageKey(origObj);
      const origKeys = imageKeys(origRootKey);
      newObj[obj.key].orig = (origKeys.reduce(deserialize(origObj, origRootKey), {}))[obj.key];
    }

    newData = {
      ...newData,
      ...newObj,
    };
  });

  newAccountData.data = newData;

  return newAccountData;
}

async function resizeImages({ accountData }) {
  // if image with size is null
  // use original to resize then save
  // save new url for size
  // upload item in memory

  if (!accountData.data) { return accountData; }

  const newAccountData = Object.assign({}, accountData);

  await Promise.all(Object.keys(accountData.data).map(async (key) => {
    try {
      const value = accountData.data[key];
      const { size } = value;
      const origUrl = value.orig ? value.orig.url : null;

      if (!value.url && size && origUrl) {
        // resize image
        const newImage = await resizeImage.call(this, { key, size, url: origUrl });

        // update response with new url
        newAccountData.data[key] = newImage;

        // save new url to db
        const updateData = {};
        updateData[key] = { size, url: newImage.url };
        await this.updateAccountImageData.execute({ userID: accountData.userID, data: updateData });
        return;
      }

      newAccountData.data[key] = value;
    } catch (e) {
      // preventing error, still return remaining data.
      console.error(e);
    }
  }));
  return newAccountData;
}

async function resizeImage({ key, size, url }) {
  const { cropped, width, height } = this.accountDataConfig[key].sizes[size];
  const fit = cropped ? 'cover' : 'inside';

  const imgRes = await fetch(url);
  const imgBuf = await imgRes.buffer();
  const resizeImgBuf = await sharp(imgBuf)
    .resize({ width, height, fit })
    .toBuffer();

  const curPath = urlUtil.parse(url).pathname.replace(/^\//g, '');
  const curPathSplit = curPath.split('.');
  const curPathExt = curPathSplit.pop();
  const curPathNoExt = curPathSplit.join('');

  const filepath = `${curPathNoExt}-${width}x${height}.${curPathExt}`;

  const newUrl = await this.saveFile({ buf: resizeImgBuf, filepath });
  return { url: newUrl, width, height };
}
