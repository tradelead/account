/** setup dependencies */
const { EventEmitter } = require('events');
const AWS = require('aws-sdk');
const knexFactory = require('knex');
const knexConfig = require('./adapters/knex/knexfile');

const env = process.env.NODE_ENV || 'development';
const knex = knexFactory(knexConfig[env]);

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const kms = new AWS.KMS({ apiVersion: '2014-11-01' });
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
const events = new EventEmitter();

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
const SaveFileS3 = require('./adapters/s3/SaveFile');
const UploadSignerS3 = require('./adapters/s3/UploadSigner');
const EncrypterAWSKMS = require('./adapters/awskms/Encrypter');
const ExchangeKeysRepo = require('./adapters/knex/ExchangeKeysRepo');
const KeycloakAuthService = require('./adapters/keycloak/AuthService');

const accountDataRepo = new AccountDataRepo({ knex });

const saveFileClass = new SaveFileS3({ s3, bucket: process.env.S3_BUCKET });
const saveFile = saveFileClass.execute.bind(saveFileClass);

const uploadSigner = new UploadSignerS3({ s3, bucket: process.env.S3_BUCKET });

const encrypter = new EncrypterAWSKMS({ kms, cmkID: process.env.AWS_KMS_CMK });
const exchangeKeysRepo = new ExchangeKeysRepo({ knex, encrypter });
const authService = new KeycloakAuthService({
  serverUrl: process.env.KEYCLOAK_SERVER_URL,
  realm: process.env.KEYCLOAK_REALM,
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
});

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
const SignUpload = require('./core/useCases/SignUpload');
const AddExchangeKeys = require('./core/useCases/AddExchangeKeys');
const GetExchangeKeys = require('./core/useCases/GetExchangeKeys');
const DeleteExchangeKeys = require('./core/useCases/DeleteExchangeKeys');

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

const signUpload = new SignUpload({
  accountDataConfig,
  uploadSigner,
});

const addExchangeKeys = new AddExchangeKeys({ exchangeKeysRepo, events });
const getExchangeKeys = new GetExchangeKeys({ exchangeKeysRepo });
const deleteExchangeKeys = new DeleteExchangeKeys({ exchangeKeysRepo, events });

/** setup controllers */

const NewImageUpload = require('./core/controllers/NewImageUpload');

const newImageUpload = new NewImageUpload({ deleteAccountImageData, updateAccountImageData });

/** setup distributed events */
const DistributedEvent = require('./adapters/sns/DistributedEvent');

const addedKeysDistributedEvent = new DistributedEvent({
  sns,
  topicArn: process.env.ADDED_KEYS_SNS_TOPIC_ARN,
});

events.on('addedExchangeKeys', async ({ userID, exchangeID }) => {
  try {
    await addedKeysDistributedEvent.emit({ traderID: userID, exchangeID });
  } catch (e) {
    console.error(e);
  }
});

const deleteKeysDistributedEvent = new DistributedEvent({
  sns,
  topicArn: process.env.DELETED_KEYS_SNS_TOPIC_ARN,
});

events.on('deletedExchangeKeys', async ({ userID, exchangeID }) => {
  try {
    await deleteKeysDistributedEvent.emit({ traderID: userID, exchangeID });
  } catch (e) {
    console.error(e);
  }
});

/** setup exports */

module.exports = {
  useCases: {
    updateAccountData: updateAccountData.execute.bind(updateAccountData),
    getAccountData: getAccountData.execute.bind(getAccountData),
    signUpload: signUpload.execute.bind(signUpload),
    addExchangeKeys: addExchangeKeys.execute.bind(addExchangeKeys),
    getExchangeKeys: getExchangeKeys.execute.bind(getExchangeKeys),
    deleteExchangeKeys: deleteExchangeKeys.execute.bind(deleteExchangeKeys),
  },
  services: {
    authService,
  },
  controllers: {
    newImageUpload: newImageUpload.execute.bind(newImageUpload),
  },
  accountDataConfig,
  events,
};
