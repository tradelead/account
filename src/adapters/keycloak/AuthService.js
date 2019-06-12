const axios = require('axios');
const jwt = require('jsonwebtoken');

module.exports = class KeycloakAuthService {
  constructor({
    serverUrl,
    realm,
  }) {
    this.serverUrl = serverUrl;
    this.realm = realm;
  }

  async get(token) {
    const decoded = await this.offlineVerifyToken(token);
    return {
      id: decoded.sub,
      email: decoded.email,
      username: decoded.preferred_username,
      roles: decoded.realm_access.roles,
    };
  }

  async getPublicKey() {
    if (!this.publicKey) {
      const realmInfo = await axios.get(`${this.serverUrl}/realms/${this.realm}`);
      this.publicKey = realmInfo.data.public_key;
    }

    return this.publicKey;
  }

  offlineVerifyToken(token) {
    return new Promise(async (resolve, reject) => {
      const publicKey = await this.getPublicKey();
      jwt.verify(token, formatPublicKey(publicKey), (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  }
};

function formatPublicKey(publicKey) {
  return `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
}
