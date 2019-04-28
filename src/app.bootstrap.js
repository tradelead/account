/** setup dependencies */
const AWS = require('aws-sdk');
const knexFactory = require('knex');
const knexConfig = require('./adapters/knex/knexfile');

const env = process.env.NODE_ENV || 'development';
const knex = knexFactory(knexConfig[env]);

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const accountDataConfig = {
  bio: {
    key: 'bio',
    type: 'string',
  },
  profilePhoto: {
    key: 'profilePhoto',
    type: 'image',
    sizes: {
      thumbnail: {
        height: 150,
        width: 150,
        cropped: true,
      },
      medium: {
        height: 300,
        width: 300,
        cropped: true,
      },
    },
  },
};

/** setup adapters */

const AccountDataRepo = require('./adapters/knex/AccountDataRepo');
const SaveFileS3 = require('./adapters/SaveFileS3');

const accountDataRepo = new AccountDataRepo({ knex });
const saveFileClass = new SaveFileS3({ s3, bucket: process.env.S3_BUCKET });
const saveFile = saveFileClass.execute.bind(saveFileClass);

/** setup services */

const GetAccountStringData = require('./core/services/GetAccountStringData');
const UpdateAccountStringData = require('./core/services/UpdateAccountStringData');
const GetAccountImageData = require('./core/services/GetAccountImageData');
const UpdateAccountImageData = require('./core/services/UpdateAccountImageData');
const DeleteAccountImageData = require('./core/services/DeleteAccountImageData');

const getAccountStringData = new GetAccountStringData({ accountDataConfig, accountDataRepo });
const updateAccountStringData = new UpdateAccountStringData({ accountDataConfig, accountDataRepo });

const updateAccountImageData = new UpdateAccountImageData({ accountDataConfig, accountDataRepo });
const deleteAccountImageData = new DeleteAccountImageData({ accountDataConfig, accountDataRepo });
const getAccountImageData = new GetAccountImageData({
  accountDataConfig,
  accountDataRepo,
  saveFile,
  updateAccountImageData,
});

/** setup useCases */

const GetAccountData = require('./core/useCases/GetAccountData');
const UpdateAccountData = require('./core/useCases/UpdateAccountData');

const dataTypeGetServices = {
  string: getAccountStringData.execute.bind(getAccountStringData),
  image: getAccountImageData.execute.bind(getAccountImageData),
};

const getAccountData = new GetAccountData({
  dataTypeServices: dataTypeGetServices,
  accountDataConfig,
});

const dataTypeUpdateServices = {
  string: updateAccountStringData.execute.bind(updateAccountStringData),
};

const updateAccountData = new UpdateAccountData({
  dataTypeServices: dataTypeUpdateServices,
  accountDataConfig,
});

/** setup controllers */

const NewImageUpload = require('./core/controllers/NewImageUpload');

const newImageUpload = new NewImageUpload({ deleteAccountImageData, updateAccountImageData });

module.exports = {
  useCases: {
    updateAccountData: updateAccountData.execute.bind(updateAccountData),
    getAccountData: getAccountData.execute.bind(getAccountData),
  },
  controllers: {
    newImageUpload: newImageUpload.execute.bind(newImageUpload),
  },
};
