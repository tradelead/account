const sinon = require('sinon');

module.exports = {
  useCases: {
    updateAccountData: sinon.stub(),
    getAccountData: sinon.stub(),
    signUpload: sinon.stub(),
    addExchangeKeys: sinon.stub(),
    getExchangeKeys: sinon.stub(),
    deleteExchangeKeys: sinon.stub(),
    getUserIdentities: sinon.stub(),
    getUserIdentityByUsername: sinon.stub(),
  },
  validExchanges: [
    {
      exchangeID: 'binance',
      exchangeLabel: 'Binance',
    },
    {
      exchangeID: 'bittrex',
      exchangeLabel: 'Bittrex',
    },
  ],
  accountDataConfig: {
    bio: {
      key: 'bio',
      type: 'string',
    },
    website: {
      key: 'website',
      type: 'url',
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
  },
};
