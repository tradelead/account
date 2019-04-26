const knexFactory = require('knex');

const knexConfig = require('../../src/adapters/knex/knexfile');

const knex = knexFactory(knexConfig.test);

module.exports = async function () {
  await knex('accountData').truncate();
  // await knex('exchangeKeys').truncate();
};
