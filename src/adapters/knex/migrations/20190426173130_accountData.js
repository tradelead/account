
const tableName = 'accountData';

exports.up = async function (knex) {
  return knex.schema.createTable(tableName, (t) => {
    t.increments('ID').primary();
    t.string('userID', 60).notNullable();
    t.string('meta_key', 60).notNullable();
    t.string('meta_value', 60).notNullable();
    t.timestamps();

    t.index(['ID']);
    t.index(['userID', 'meta_key']);
  });
};

exports.down = async function (knex) {
  return knex.schema.dropTable(tableName);
};
