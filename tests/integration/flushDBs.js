const knexFactory = require('knex');

const knexConfig = require('../../src/adapters/knex/knexfile');

const knex = knexFactory(knexConfig.test);

module.exports = async function () {
  await knex('exchangeIngress').truncate();
  await knex('orders').truncate();
  await knex('portfolio').truncate();
  await knex('portfolioAssets').truncate();
  await knex('scores').truncate();
  await knex('scoreUpdateSchedule').truncate();
  await knex('trades').truncate();
  await knex('transfers').truncate();
};
