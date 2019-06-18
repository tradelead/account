const axios = require('axios');
const get = require('lodash.get');
const memoize = require('memoizee');

module.exports = class UserIdentitiesService {
  constructor({
    serverUrl,
    realm,
    clientId,
    clientSecret,
  }) {
    this.serverUrl = serverUrl;
    this.realm = realm;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.keycloakUserResponseTransform = this.keycloakUserResponseTransform.bind(this);

    const memoizeOpts = {
      promise: true,
      max: 1000,
      maxAge: 60000,
      normalizer(args) {
        return JSON.stringify(args);
      },
    };

    this.getUser = memoize(this.getUser, memoizeOpts);
    this.getByUsername = memoize(this.getByUsername, memoizeOpts);
  }

  async getUsers(ids) {
    return Promise.all(ids.map(async (id) => {
      try {
        return await this.getUser(id);
      } catch (error) {
        console.error(error);
        return null;
      }
    }));
  }

  async getUser(id) {
    const response = await axios.get(
      `${this.serverUrl}/admin/realms/${this.realm}/users/${id}`,
      {
        headers: {
          Authorization: `Bearer ${await this.getClientAccessToken()}`,
        },
      },
    );

    return this.keycloakUserResponseTransform({ response });
  }

  async getRoles(id) {
    if (!id) { return []; }

    try {
      const response = await axios.get(
        `${this.serverUrl}/admin/realms/${this.realm}/users/${id}/role-mappings/realm`,
        {
          headers: {
            Authorization: `Bearer ${await this.getClientAccessToken()}`,
          },
        },
      );
      return response && response.data.map && response.data.map(role => role.name);
    } catch (error) {
      console.error(error);
    }

    return [];
  }

  async getByUsername(username) {
    try {
      const response = await axios.get(
        `${this.serverUrl}/admin/realms/${this.realm}/users`,
        {
          params: { username },
          headers: {
            Authorization: `Bearer ${await this.getClientAccessToken()}`,
          },
        },
      );

      return this.keycloakUserResponseTransform({ response });
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 404) {
        throw new Error('Cannot find user');
      } else {
        throw new Error('Internal error');
      }
    }
  }

  async getClientAccessToken() {
    if (this.clientAccessToken && this.clientAccessTokenExp > Date.now()) {
      return this.clientAccessToken;
    }

    let refreshFailed = false;
    let response = { data: {} };

    if (this.clientRefreshToken && this.clientRefreshTokenExp > Date.now()) {
      try {
        response = await axios.post(
          `${this.serverUrl}/realms/${this.realm}/protocol/openid-connect/token`,
          `grant_type=refresh_token&client_id=${this.clientId}&client_secret=${this.clientSecret}&refresh_token=${this.clientRefreshToken}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        );
      } catch (e) {
        console.error(e);
        refreshFailed = true;
      }
    }

    if (!this.clientRefreshToken || refreshFailed || this.clientRefreshTokenExp <= Date.now()) {
      const base64ClientCredentials = Buffer
        .from(`${this.clientId}:${this.clientSecret}`)
        .toString('base64');

      response = await axios.post(
        `${this.serverUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${base64ClientCredentials}`,
          },
        },
      );
    }

    if (response) {
      this.clientAccessToken = response.data.access_token;
      this.clientAccessTokenExp = Date.now() + ((response.data.expires_in - 10) * 1000);
      this.clientRefreshToken = response.data.refresh_token;
      this.clientRefreshTokenExp = Date.now() + ((response.data.refresh_expires_in - 10) * 1000);
    }

    return this.clientAccessToken;
  }

  async keycloakUserResponseTransform(userDetail) {
    if (userDetail.response) {
      let roles = [];

      try {
        roles = await this.getRoles(get(userDetail, 'response.data.id'));
      } catch (e) {
        console.error(e);
      }

      return {
        id: get(userDetail, 'response.data.id'),
        email: get(userDetail, 'response.data.email'),
        username: get(userDetail, 'response.data.username'),
        roles,
      };
    }

    return null;
  }
};
