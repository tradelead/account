/** setup dependencies */
const knexFactory = require('knex');
const knexConfig = require('./adapters/knex/knexfile');

const env = process.env.NODE_ENV || 'development';
const knex = knexFactory(knexConfig[env]);

/** setup adapters */
const AccountDataRepo = require('./adapters/knex/AccountDataRepo');

const accountDataRepo = new AccountDataRepo({ knex });

/** setup useCases */
const accountDataConfig = [
  {
    key: 'bio',
    type: 'string',
  },
];

const GetAccountData = require('./core/useCases/GetAccountData');
const UpdateAccountData = require('./core/useCases/UpdateAccountData');

const getAccountData = new GetAccountData({ accountDataRepo, accountDataConfig });
const updateAccountData = new UpdateAccountData({ accountDataRepo, accountDataConfig });

module.exports = {
  useCases: {
    updateAccountData: updateAccountData.execute.bind(updateAccountData),
    getAccountData: getAccountData.execute.bind(getAccountData),
  },
};
