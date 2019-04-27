module.exports = class AccountDataRepo {
  constructor({ knex }) {
    this.knex = knex;
    this.tableName = 'accountData';
  }

  async updateAccountData({ userID, data }) {
    const columns = ['userID', 'metaKey', 'metaValue'];

    const bulkUpdateQuery = [
      `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES`,
      Object.keys(data).map(() => `(${columns.map(() => '?').join(',')})`).join(','),
      'ON DUPLICATE KEY UPDATE',
      'metaValue = VALUES(metaValue)',
    ].join(' ');

    const values = [];
    Object.keys(data).forEach(key => values.push(...[userID, key, data[key]]));

    await this.knex.raw(bulkUpdateQuery, values);
  }

  async getAccountData(data) {
    const whereBuilder = (builder) => {
      data.forEach(({ userID, keys }) => {
        builder.orWhere((userBuilder) => {
          userBuilder
            .where({ userID })
            .andWhere((keyBuilder) => {
              keys.forEach((key) => {
                keyBuilder.orWhere({ metaKey: key });
              });
            });
        });
      });
    };

    const rows = await this.knex(this.tableName)
      .select()
      .where(whereBuilder);

    const userData = rows.reduce((acc, row) => {
      acc[row.userID] = acc[row.userID] || {};
      acc[row.userID][row.metaKey] = row.metaValue;
      return acc;
    }, {});

    return Object.values(data).map(item => userData[item.userID]);
  }
};
