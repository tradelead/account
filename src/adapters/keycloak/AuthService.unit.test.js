const mockAxios = require('axios');
const jwt = require('jsonwebtoken');
const KeycloakAuthService = require('./AuthService');

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQC3NuwQepMBKU719lyaFT4uc4klalPYkE/Evoqtybgsy7+pOQ/d
qat40CdXoDWKq1LNp+WPlZNkswxhkXZtcTHlR7D58V+pJMtav+1C6kUnKzSvNfhP
SX9IfpqYcLI6sn7Ti6ujzlEIrTufets1n7H04hE5s7VMzbbt4Qa5c3dNAwIDAQAB
AoGAFdKG35eZ9uNysj073mZ1V5cPWNOHVR4rQiXn4rdKJpvGImPXjfFtqSAx72/3
sKKjZDeBUk7glXf2G5D16Cc5Z//Vax9j1eEhmdwDO4kEMDGjKYM9rAJf4SD7/HUY
rwg92tT4S5hMtJKXph2w+X1bdwXEulZkni0QXLq1a4Yd+OECQQD1+T0xVkAB6oj1
qacSYdEjgKp0BavRkPSn+UcfuHl3avMD4ImgWQBEX5sFBniQJQdX2qDqN1kSW0KC
9l1xuaIpAkEAvq7JHsihk/kvy0cZkoCVIkna9pQEFPVcqjBSyhV+0qDckWXxbaXA
8Fy/nJ/3CCxM7wi+28KsHg3iwaAgVaXTSwJBAO9XeH27aUj0CBTS4ej3GWOsXS/M
HOYsYIPaAaUSAc97V8AcCo7mS2Y8iUEYjNPl1AFekVmWRaug9VUtmLuCYBECQBel
Vx1xJdBSw2GC5KHtPhEtdXDEdCkhMCeOrIWQ2tRFzHRfXuwI9P8ZkU1b7Odfjv7J
Z9mar3ten3MBZ2EXmjcCQQC5/IaaspcQEMUi/CMFSaKbtJjOxHLDonFn2Hwe+Da3
ZbVXMbdRiOlilfUyRm6gf0iwyyDYjAnjskVFh8904YJv
-----END RSA PRIVATE KEY-----`;

let keycloakResponse = {};

beforeEach(() => {
  keycloakResponse = {
    data: {
      realm: 'main',
      public_key: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3NuwQepMBKU719lyaFT4uc4klalPYkE/Evoqtybgsy7+pOQ/dqat40CdXoDWKq1LNp+WPlZNkswxhkXZtcTHlR7D58V+pJMtav+1C6kUnKzSvNfhPSX9IfpqYcLI6sn7Ti6ujzlEIrTufets1n7H04hE5s7VMzbbt4Qa5c3dNAwIDAQAB',
      'token-service': 'http://test.com/auth/realms/main/protocol/openid-connect',
      'account-service': 'http://test.com/auth/realms/main/account',
      'tokens-not-before': 0,
    },
  };

  mockAxios.get = jest.fn();
});

it('verifies and decodes token and returns user details', async () => {
  const token = generateJWT(Math.trunc((Date.now() + 10000) / 1000));
  mockAxios.get.mockImplementationOnce(() => Promise.resolve(keycloakResponse));

  const authService = new KeycloakAuthService({
    serverUrl: 'http://test.com/auth',
    realm: 'main',
  });

  // returns proper user details from payload
  const auth = await authService.get(token);
  expect(auth).toEqual({
    id: '3393f145-19ef-44b5-9a44-71a154de46fb',
    email: 'test@test.com',
    username: 'testing123',
    roles: [
      'offline_access',
      'trader',
      'uma_authorization',
    ],
  });

  // calls keycloak with proper url.
  expect(mockAxios.get).toHaveBeenCalledTimes(1);
  expect(mockAxios.get).toHaveBeenCalledWith('http://test.com/auth/realms/main');

  // only calls keycloak once after verifying multiple tokens.
  await authService.get(token);
  expect(mockAxios.get).toHaveBeenCalledTimes(1);
});

it('rejects if public key fails', async () => {
  const token = generateJWT(Math.trunc((Date.now() + 10000) / 1000));
  keycloakResponse.data.public_key = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCZ/NdHLMYYbT6D17M/BagLUmBa/Y3onGVJhYoDieVMfvhqGHvHDqzc2KQBTU+2z6sUdOO4hjFeWS1mihOsEka4DE9T/0cx9a5qizTUkz3Hxyruxl6Zmx7BY9kddoI7lvK0DFfXk6+JlV34kt97ixzqdd/fuakrPDPadbi7AQ9UZwIDAQAB';
  mockAxios.get.mockImplementationOnce(() => Promise.resolve(keycloakResponse));

  const authService = new KeycloakAuthService({
    serverUrl: 'http://test.com/auth',
    realm: 'main',
  });

  return expect(authService.get(token)).rejects.toThrow(new Error('invalid signature'));
});

it('rejects if token is expired', async () => {
  const token = generateJWT(Math.trunc((Date.now() - 10000) / 1000));
  mockAxios.get.mockImplementationOnce(() => Promise.resolve(keycloakResponse));

  const authService = new KeycloakAuthService({
    serverUrl: 'http://test.com/auth',
    realm: 'main',
  });

  return expect(authService.get(token)).rejects.toThrow(new Error('jwt expired'));
});

function generateJWT(exp) {
  const payload = {
    jti: 'cc8d76fe-b2fa-4328-ad2f-5069cfeff9a3',
    exp,
    nbf: 0,
    iat: 1560003230,
    iss: 'http://test.com/auth/realms/main',
    aud: 'account',
    sub: '3393f145-19ef-44b5-9a44-71a154de46fb',
    typ: 'Bearer',
    azp: 'app',
    auth_time: 0,
    session_state: 'dff4532a-2d20-4210-b337-3b3ce020f552',
    acr: '1',
    'allowed-origins': [
      '/auth/realms',
    ],
    realm_access: {
      roles: [
        'offline_access',
        'trader',
        'uma_authorization',
      ],
    },
    resource_access: {
      account: {
        roles: [
          'manage-account',
          'manage-account-links',
          'view-profile',
        ],
      },
    },
    scope: 'email profile',
    email_verified: false,
    preferred_username: 'testing123',
    email: 'test@test.com',
  };
  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}
