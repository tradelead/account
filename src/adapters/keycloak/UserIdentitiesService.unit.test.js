const sinon = require('sinon');

const clock = sinon.useFakeTimers(Date.now());

afterAll(() => clock.restore());

jest.mock('axios');
const mockAxios = require('axios');
const UserIdentitiesService = require('./UserIdentitiesService');

let userIdentitiesService;

beforeEach(() => {
  mockAxios.get.reset();
  mockAxios.post.reset();

  clock.reset();

  userIdentitiesService = new UserIdentitiesService({
    serverUrl: 'http://test.com/auth',
    realm: 'main',
    clientId: 'testClientId',
    clientSecret: 'testClientSecret',
  });
});

describe('getUsers', () => {
  beforeEach(() => {
    mockAxios.get
      .withArgs(
        sinon.match('http://test.com/auth/admin/realms/main/users/test'),
      )
      .callsFake(async url => (
        {
          data: {
            id: url,
            createdTimestamp: 1558733361060,
            username: 'test1',
            enabled: true,
            totp: false,
            emailVerified: false,
            email: 'test1@test.com',
            disableableCredentialTypes: ['password'],
            requiredActions: [],
            notBefore: 0,
            access: {
              manageGroupMembership: false,
              view: true,
              mapRoles: false,
              impersonate: false,
              manage: false,
            },
          },
        }
      ));
  });

  it('caches each user result separately for 1 minute', async () => {
    const users1 = await userIdentitiesService.getUsers(['test1', 'test2', 'test3']);
    const users1Refetch = await userIdentitiesService.getUsers(['test1', 'test2', 'test3']);
    const users2 = await userIdentitiesService.getUsers(['test1', 'test2', 'test4']);
    const users2Refetch = await userIdentitiesService.getUsers(['test1', 'test2', 'test4']);

    expect(users1Refetch).toEqual(users1);
    expect(users2Refetch).toEqual(users2);

    let callsCount = {};
    mockAxios.get.getCalls().forEach((call) => {
      if (!callsCount[call.args[0]]) { callsCount[call.args[0]] = 0; }
      callsCount[call.args[0]] += 1;
    });

    expect(callsCount['http://test.com/auth/admin/realms/main/users/test1']).toBe(1);
    expect(callsCount['http://test.com/auth/admin/realms/main/users/test2']).toBe(1);
    expect(callsCount['http://test.com/auth/admin/realms/main/users/test3']).toBe(1);
    expect(callsCount['http://test.com/auth/admin/realms/main/users/test4']).toBe(1);

    clock.tick(60000);

    await userIdentitiesService.getUsers(['test1', 'test2', 'test3']);

    callsCount = {};
    mockAxios.get.getCalls().forEach((call) => {
      if (!callsCount[call.args[0]]) { callsCount[call.args[0]] = 0; }
      callsCount[call.args[0]] += 1;
    });

    expect(callsCount['http://test.com/auth/admin/realms/main/users/test1']).toBe(1);
    expect(callsCount['http://test.com/auth/admin/realms/main/users/test2']).toBe(1);
    expect(callsCount['http://test.com/auth/admin/realms/main/users/test3']).toBe(1);
  });
});

describe('getByUsername', () => {
  beforeEach(() => {
    mockAxios.get
      .withArgs('http://test.com/auth/admin/realms/main/users')
      .callsFake(async (url, options) => {
        console.log(url, options);
        return {
          data: {
            id: options.params.username,
            createdTimestamp: 1558733361060,
            username: options.params.username,
            enabled: true,
            totp: false,
            emailVerified: false,
            email: `${options.params.username}@test.com`,
            disableableCredentialTypes: ['password'],
            requiredActions: [],
            notBefore: 0,
            access: {
              manageGroupMembership: false,
              view: true,
              mapRoles: false,
              impersonate: false,
              manage: false,
            },
          },
        };
      });
  });

  it('caches result for 1 minute', async () => {
    const user1 = await userIdentitiesService.getByUsername('test123');
    const user1Refetch = await userIdentitiesService.getByUsername('test123');
    const user2 = await userIdentitiesService.getByUsername('test234');
    const user2Refetch = await userIdentitiesService.getByUsername('test234');

    expect(user1Refetch).toEqual(user1);
    expect(user2Refetch).toEqual(user2);

    let callsCount = {};
    mockAxios.get.getCalls().forEach((call) => {
      const key = call.args[1].params && call.args[1].params.username;
      if (!callsCount[key]) { callsCount[key] = 0; }
      callsCount[key] += 1;
    });

    expect(callsCount.test123).toBe(1);
    expect(callsCount.test234).toBe(1);

    clock.tick(60000);

    await userIdentitiesService.getByUsername('test123');

    callsCount = {};
    mockAxios.get.getCalls().forEach((call) => {
      const key = call.args[1].params && call.args[1].params.username;
      if (!callsCount[key]) { callsCount[key] = 0; }
      callsCount[key] += 1;
    });

    expect(callsCount.test123).toBe(1);
  });
});

describe('getClientAccessToken', () => {
  it('creates access token with credentials when doesn\'t exist and no refresh token', async () => {
    const newToken = 'testAccessToken';

    mockAxios.post
      .withArgs(
        'http://test.com/auth/realms/main/protocol/openid-connect/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic dGVzdENsaWVudElkOnRlc3RDbGllbnRTZWNyZXQ=',
          },
        },
      )
      .resolves({
        data: {
          access_token: newToken,
          expires_in: 1800,
          refresh_expires_in: 1800,
          refresh_token: 'refresh_token',
          token_type: 'bearer',
          'not-before-policy': 0,
          session_state: '9d23c1d1-73a0-436f-9b36-6720783cf109',
          scope: 'email profile',
        },
      });

    const token = await userIdentitiesService.getClientAccessToken();
    expect(token).toEqual(newToken);
  });

  it('returns existing access token', async () => {
    const newToken = 'testAccessToken';
    const expiresIn = 1800;
    const newRefreshToken = 'refreshAccessToken';
    const refreshExpiresIn = 3600;

    mockAxios.post
      .withArgs(
        'http://test.com/auth/realms/main/protocol/openid-connect/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic dGVzdENsaWVudElkOnRlc3RDbGllbnRTZWNyZXQ=',
          },
        },
      )
      .resolves({
        data: {
          access_token: newToken,
          expires_in: expiresIn,
          refresh_expires_in: refreshExpiresIn,
          refresh_token: newRefreshToken,
          token_type: 'bearer',
          'not-before-policy': 0,
          session_state: '9d23c1d1-73a0-436f-9b36-6720783cf109',
          scope: 'email profile',
        },
      });

    await userIdentitiesService.getClientAccessToken();
    const token2 = await userIdentitiesService.getClientAccessToken();
    expect(token2).toEqual(newToken);

    sinon.assert.calledOnce(mockAxios.post);
  });

  it('creates access token with refresh token when existing access token is expired or 10 seconds prior to expiration', async () => {
    const newToken = 'testAccessToken';
    const expiresIn = 1800;
    const newRefreshToken = 'refreshAccessToken';
    const refreshExpiresIn = 3600;

    mockAxios.post
      .withArgs(
        'http://test.com/auth/realms/main/protocol/openid-connect/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic dGVzdENsaWVudElkOnRlc3RDbGllbnRTZWNyZXQ=',
          },
        },
      )
      .resolves({
        data: {
          access_token: newToken,
          expires_in: expiresIn,
          refresh_expires_in: refreshExpiresIn,
          refresh_token: newRefreshToken,
          token_type: 'bearer',
          'not-before-policy': 0,
          session_state: '9d23c1d1-73a0-436f-9b36-6720783cf109',
          scope: 'email profile',
        },
      });

    await userIdentitiesService.getClientAccessToken();

    clock.tick((expiresIn - 10) * 1000);

    const newToken2 = 'testAccessToken';
    const expiresIn2 = 1800;
    const newRefreshToken2 = 'refreshAccessToken';
    const refreshExpiresIn2 = 3600;

    mockAxios.post
      .withArgs(
        'http://test.com/auth/realms/main/protocol/openid-connect/token',
        `grant_type=refresh_token&client_id=${userIdentitiesService.clientId}&client_secret=${userIdentitiesService.clientSecret}&refresh_token=${newRefreshToken}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      .resolves({
        data: {
          access_token: newToken2,
          expires_in: expiresIn2,
          refresh_expires_in: newRefreshToken2,
          refresh_token: refreshExpiresIn2,
          token_type: 'bearer',
          'not-before-policy': 0,
          session_state: '9d23c1d1-73a0-436f-9b36-6720783cf109',
          scope: 'email profile',
        },
      });

    const token2 = await userIdentitiesService.getClientAccessToken();
    expect(token2).toEqual(newToken);

    sinon.assert.calledTwice(mockAxios.post);
  });

  it('creates access token with credentials when refresh token fails to create new access token', async () => {
    const newToken = 'testAccessToken';
    const expiresIn = 1800;
    const newRefreshToken = 'refreshAccessToken';
    const refreshExpiresIn = 3600;

    mockAxios.post
      .withArgs(
        'http://test.com/auth/realms/main/protocol/openid-connect/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic dGVzdENsaWVudElkOnRlc3RDbGllbnRTZWNyZXQ=',
          },
        },
      )
      .resolves({
        data: {
          access_token: newToken,
          expires_in: expiresIn,
          refresh_expires_in: refreshExpiresIn,
          refresh_token: newRefreshToken,
          token_type: 'bearer',
          'not-before-policy': 0,
          session_state: '9d23c1d1-73a0-436f-9b36-6720783cf109',
          scope: 'email profile',
        },
      });

    await userIdentitiesService.getClientAccessToken();

    clock.tick((expiresIn - 10) * 1000);

    const error = new Error();
    error.response = {
      data: {},
      headers: {},
      status: 400,
    };

    mockAxios.post
      .withArgs(
        'http://test.com/auth/realms/main/protocol/openid-connect/token',
        `grant_type=refresh_token&client_id=${userIdentitiesService.clientId}&client_secret=${userIdentitiesService.clientSecret}&refresh_token=${newRefreshToken}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      .rejects(error);

    const newToken2 = 'testAccessToken2';
    const expiresIn2 = 1800;
    const newRefreshToken2 = 'refreshAccessToken2';
    const refreshExpiresIn2 = 3600;

    mockAxios.post
      .withArgs(
        'http://test.com/auth/realms/main/protocol/openid-connect/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic dGVzdENsaWVudElkOnRlc3RDbGllbnRTZWNyZXQ=',
          },
        },
      )
      .resolves({
        data: {
          access_token: newToken2,
          expires_in: expiresIn2,
          refresh_expires_in: refreshExpiresIn2,
          refresh_token: newRefreshToken2,
          token_type: 'bearer',
          'not-before-policy': 0,
          session_state: '9d23c1d1-73a0-436f-9b36-6720783cf109',
          scope: 'email profile',
        },
      });

    const token2 = await userIdentitiesService.getClientAccessToken();
    expect(token2).toEqual(newToken2);

    sinon.assert.calledThrice(mockAxios.post);
  });

  it('creates access token with credentials when refresh token is expired or 10 seconds prior to expiration', async () => {
    const newToken = 'testAccessToken';
    const expiresIn = 1800;
    const newRefreshToken = 'refreshAccessToken';
    const refreshExpiresIn = 3600;

    mockAxios.post
      .withArgs(
        'http://test.com/auth/realms/main/protocol/openid-connect/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic dGVzdENsaWVudElkOnRlc3RDbGllbnRTZWNyZXQ=',
          },
        },
      )
      .resolves({
        data: {
          access_token: newToken,
          expires_in: expiresIn,
          refresh_expires_in: refreshExpiresIn,
          refresh_token: newRefreshToken,
          token_type: 'bearer',
          'not-before-policy': 0,
          session_state: '9d23c1d1-73a0-436f-9b36-6720783cf109',
          scope: 'email profile',
        },
      });

    await userIdentitiesService.getClientAccessToken();

    clock.tick((refreshExpiresIn - 10) * 1000);

    const newToken2 = 'testAccessToken2';
    const expiresIn2 = 1800;
    const newRefreshToken2 = 'refreshAccessToken2';
    const refreshExpiresIn2 = 3600;

    mockAxios.post
      .withArgs(
        'http://test.com/auth/realms/main/protocol/openid-connect/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic dGVzdENsaWVudElkOnRlc3RDbGllbnRTZWNyZXQ=',
          },
        },
      )
      .resolves({
        data: {
          access_token: newToken2,
          expires_in: expiresIn2,
          refresh_expires_in: refreshExpiresIn2,
          refresh_token: newRefreshToken2,
          token_type: 'bearer',
          'not-before-policy': 0,
          session_state: '9d23c1d1-73a0-436f-9b36-6720783cf109',
          scope: 'email profile',
        },
      });

    const token2 = await userIdentitiesService.getClientAccessToken();
    expect(token2).toEqual(newToken2);
  });
});
