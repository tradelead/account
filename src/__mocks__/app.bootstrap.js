const sinon = require('sinon');

module.exports = {
  useCases: {
    updateAccountData: sinon.stub(),
    getAccountData: sinon.stub(),
    signUpload: sinon.stub(),
    addExchangeKeys: sinon.stub(),
    getExchangeKeys: sinon.stub(),
    deleteExchangeKeys: sinon.stub(),
  },
  accountDataConfig: {
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
  },
};
