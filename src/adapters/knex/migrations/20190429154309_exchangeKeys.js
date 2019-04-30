
const tableName = 'exchangeKeys';

exports.up = async function (knex) {
  return knex.schema.createTable(tableName, (t) => {
    t.increments('ID').primary();
    t.string('userID', 60).notNullable();
    t.string('exchangeID', 60).notNullable();
    t.string('tokenLast4', 4).notNullable();
    t.binary('tokenCiphertext').notNullable();
    t.string('secretLast4', 4).notNullable();
    t.binary('secretCiphertext').notNullable();
    t.timestamps();

    t.index(['ID']);
    t.unique(['userID', 'exchangeID']);
  });
};

exports.down = async function (knex) {
  return knex.schema.dropTable(tableName);
};
