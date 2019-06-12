const axios = require('axios');
const get = require('lodash.get');

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
  }

  async getUsers(ids) {
    const userDetails = await Promise.all(ids.map(async (id) => {
      try {
        const response = await axios.get(
          `${this.serverUrl}/admin/realms/${this.realm}/users/${id}`,
          {
            headers: {
              Authorization: `Bearer ${await this.getClientAccessToken()}`,
            },
          },
        );

        return {
          response,
        };
      } catch (error) {
        console.error(error);
        return {
          error,
        };
      }
    }));

    return Promise.all(userDetails.map(async (userDetail) => {
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
    }));
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
      return response.data.map(role => role.name);
    } catch (error) {
      console.error(error);
    }

    return [];
  }

  async getByUsername(username) {

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

    if (!this.clientRefreshToken || refreshFailed) {
      const base64ClientCredentials = Buffer
        .from(`${this.clientId}:${this.clientSecret}`)
        .toString('base64');
      console.log(
        `${this.serverUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${base64ClientCredentials}`,
          },
        },
      );
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

    this.clientAccessToken = response.data.access_token;
    this.clientAccessTokenExp = Date.now() + ((response.data.expires_in - 10) * 1000);
    this.clientRefreshToken = response.data.refresh_token;
    this.clientRefreshTokenExp = Date.now() + ((response.data.refresh_expires_in - 10) * 1000);

    return this.clientAccessToken;
  }
};
