module.exports = class ExchangeKeysRepo {
  constructor({ knex, encrypter }) {
    this.knex = knex;
    this.encrypter = encrypter;
    this.tableName = 'exchangeKeys';
  }

  async add({
    userID,
    exchangeID,
    token,
    secret,
  }) {
    const tokenCiphertext = await this.encrypter.encrypt(token);
    const secretCiphertext = await this.encrypter.encrypt(secret);

    try {
      await this.knex(this.tableName).insert({
        userID,
        exchangeID,
        tokenCiphertext,
        tokenLast4: token.substr(token.length - 4),
        secretCiphertext,
        secretLast4: secret.substr(secret.length - 4),
      });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        throw new Error('Keys for that exchange already exists');
      }

      throw e;
    }
  }

  async get({ userID, exchangeIDs, decrypt }) {
    const query = this.knex(this.tableName)
      .select().where({ userID });

    if (exchangeIDs) {
      query.andWhere((builder) => {
        exchangeIDs.forEach((exchangeID) => {
          builder.orWhere({ exchangeID });
        });
      });
    }

    const keys = await query;

    return Promise.all(keys.map(async (key) => {
      const keyObj = {
        exchangeID: key.exchangeID,
        tokenLast4: key.tokenLast4,
        secretLast4: key.secretLast4,
      };

      if (decrypt) {
        const tokenProm = this.encrypter.decrypt(key.tokenCiphertext);
        const secretProm = this.encrypter.decrypt(key.secretCiphertext);

        try {
          keyObj.token = await tokenProm;
        } catch (e) {
          console.error('error decrypting token', e);
        }

        try {
          keyObj.secret = await secretProm;
        } catch (e) {
          console.error('error decrypting secret', e);
        }
      }

      return keyObj;
    }));
  }

  async delete({ userID, exchangeID }) {
    await this.knex(this.tableName).where({ userID, exchangeID }).del();
  }
};
