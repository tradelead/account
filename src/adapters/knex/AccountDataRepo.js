const Dataloader = require('dataloader');

module.exports = class AccountDataRepo {
  constructor({ knex }) {
    this.knex = knex;
    this.tableName = 'accountData';
    this.updateLoader = new Dataloader(bulkUpdate.bind(this), { cache: false });
    this.getLoader = new Dataloader(bulkGet.bind(this), { cache: false });
  }

  async update({ userID, data }) {
    await this.updateLoader.load({ userID, data });
  }

  async get({ userID, keys }) {
    return this.getLoader.load({ userID, keys });
  }

  async delete({ userID, rootKey }) {
    if (rootKey.length === 0) {
      throw new Error('Root Key is required');
    }

    await this.knex(this.tableName)
      .where({ userID })
      .andWhere('metaKey', 'like', `${rootKey}%`)
      .del();
  }
};

async function bulkUpdate(items) {
  const columns = ['userID', 'metaKey', 'metaValue'];

  let dataLength = 0;
  const values = [];
  items.forEach(({ userID, data }) => {
    const dataKeys = Object.keys(data);
    dataLength += dataKeys.length;
    dataKeys.forEach(key => values.push(...[userID, key, data[key]]));
  });

  const dataLengthArr = new Array(dataLength).fill(0);
  const bulkUpdateQuery = [
    `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES`,
    dataLengthArr.map(() => `(${columns.map(() => '?').join(',')})`).join(','),
    'ON DUPLICATE KEY UPDATE',
    'metaValue = VALUES(metaValue)',
  ].join(' ');

  await this.knex.raw(bulkUpdateQuery, values);
  return new Array(items.length).fill(null);
}

async function bulkGet(data) {
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

  return Object.values(data).map(item => ({ userID: item.userID, data: userData[item.userID] }));
}
