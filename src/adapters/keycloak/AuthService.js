module.exports = class KeycloakAuthService {
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

  async get(token) {
    // TODO: introspect token to verify (see: http://lists.jboss.org/pipermail/keycloak-user/2016-April/005869.html)
  }
};
