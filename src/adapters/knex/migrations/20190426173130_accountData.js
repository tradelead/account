
const tableName = 'accountData';

exports.up = async function (knex) {
  return knex.schema.createTable(tableName, (t) => {
    t.increments('ID').primary();
    t.string('userID', 60).notNullable();
    t.string('metaKey', 60).notNullable();
    t.string('metaValue', 60).notNullable();
    t.timestamps();

    t.index(['ID']);
    t.unique(['userID', 'metaKey']);
  });
};

exports.down = async function (knex) {
  return knex.schema.dropTable(tableName);
};
