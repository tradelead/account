const sinon = require('sinon');

jest.mock('axios');
const mockAxios = require('axios');
const app = require('../../src/app.bootstrap');

beforeEach(() => {
  mockAxios.get.reset();
  mockAxios.post.reset();
});

describe('getUserIdentities', () => {
  it('resolves with users details', async () => {
    // MOCK HTTP RESPONSES
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
          access_token: 'access_token',
          expires_in: 1800,
          refresh_expires_in: 1800,
          refresh_token: 'refresh_token',
          token_type: 'bearer',
          'not-before-policy': 0,
          session_state: '9d23c1d1-73a0-436f-9b36-6720783cf109',
          scope: 'email profile',
        },
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId1',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .resolves({
        data: {
          id: 'testId1',
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
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId2',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .resolves({
        data: {
          id: 'testId2',
          createdTimestamp: 1558733361060,
          username: 'test2',
          enabled: true,
          totp: false,
          emailVerified: false,
          email: 'test2@test.com',
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
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId1/role-mappings/realm',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .resolves({
        data: [
          {
            id: 'efb2f091-01be-4aae-ad90-9aad2def65ee',
            name: 'offline_access',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: '8b54f81f-4203-44fe-b002-83a72c4e708a',
            name: 'uma_authorization',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: 'f4b0c5cd-6c34-46fe-8cb1-73f9a387adbb',
            name: 'trader',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
        ],
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId2/role-mappings/realm',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .resolves({
        data: [
          {
            id: 'efb2f091-01be-4aae-ad90-9aad2def65ee',
            name: 'offline_access',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: '8b54f81f-4203-44fe-b002-83a72c4e708a',
            name: 'uma_authorization',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: 'f4b0c5cd-6c34-46fe-8cb1-73f9a387adbb',
            name: 'trader',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
        ],
      });
    // END: MOCK HTTP RESPONSES

    const users = await app.useCases.getUserIdentities(['testId1', 'testId2']);
    console.log(users);
    expect(users).toEqual([
      {
        id: 'testId1',
        email: 'test1@test.com',
        username: 'test1',
        roles: ['offline_access', 'uma_authorization', 'trader'],
      },
      {
        id: 'testId2',
        email: 'test2@test.com',
        username: 'test2',
        roles: ['offline_access', 'uma_authorization', 'trader'],
      },
    ]);
  });

  it('resolves with null item if an id is not found', async () => {
    // MOCK HTTP RESPONSES
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
          access_token: 'access_token',
          expires_in: 1800,
          refresh_expires_in: 1800,
          refresh_token: 'refresh_token',
          token_type: 'bearer',
          'not-before-policy': 0,
          session_state: '9d23c1d1-73a0-436f-9b36-6720783cf109',
          scope: 'email profile',
        },
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId2',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .resolves({
        data: {
          id: 'testId2',
          createdTimestamp: 1558733361060,
          username: 'test2',
          enabled: true,
          totp: false,
          emailVerified: false,
          email: 'test2@test.com',
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
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId3',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .rejects({
        response: {
          status: 404,
        },
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId2/role-mappings/realm',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .resolves({
        data: [
          {
            id: 'efb2f091-01be-4aae-ad90-9aad2def65ee',
            name: 'offline_access',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: '8b54f81f-4203-44fe-b002-83a72c4e708a',
            name: 'uma_authorization',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: 'f4b0c5cd-6c34-46fe-8cb1-73f9a387adbb',
            name: 'trader',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
        ],
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId3/role-mappings/realm',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .resolves({
        data: [
          {
            id: 'efb2f091-01be-4aae-ad90-9aad2def65ee',
            name: 'offline_access',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: '8b54f81f-4203-44fe-b002-83a72c4e708a',
            name: 'uma_authorization',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: 'f4b0c5cd-6c34-46fe-8cb1-73f9a387adbb',
            name: 'trader',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
        ],
      });
    // END: MOCK HTTP RESPONSES

    const users = await app.useCases.getUserIdentities(['testId2', 'testId3']);
    expect(users).toEqual([
      {
        id: 'testId2',
        email: 'test2@test.com',
        username: 'test2',
        roles: ['offline_access', 'uma_authorization', 'trader'],
      },
      null,
    ]);
  });

  it('resolves with null when http errors', async () => {
    // MOCK HTTP RESPONSES
    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId4',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .resolves({
        data: {
          id: 'testId4',
          createdTimestamp: 1558733361060,
          username: 'test4',
          enabled: true,
          totp: false,
          emailVerified: false,
          email: 'test4@test.com',
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
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId5',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .rejects({
        response: {
          status: 500,
        },
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId4/role-mappings/realm',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .resolves({
        data: [
          {
            id: 'efb2f091-01be-4aae-ad90-9aad2def65ee',
            name: 'offline_access',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: '8b54f81f-4203-44fe-b002-83a72c4e708a',
            name: 'uma_authorization',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: 'f4b0c5cd-6c34-46fe-8cb1-73f9a387adbb',
            name: 'trader',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
        ],
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId5/role-mappings/realm',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .resolves({
        data: [
          {
            id: 'efb2f091-01be-4aae-ad90-9aad2def65ee',
            name: 'offline_access',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: '8b54f81f-4203-44fe-b002-83a72c4e708a',
            name: 'uma_authorization',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: 'f4b0c5cd-6c34-46fe-8cb1-73f9a387adbb',
            name: 'trader',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
        ],
      });
    // END: MOCK HTTP RESPONSES

    const users = await app.useCases.getUserIdentities(['testId4', 'testId5']);
    expect(users).toEqual([
      {
        id: 'testId4',
        email: 'test4@test.com',
        username: 'test4',
        roles: ['offline_access', 'uma_authorization', 'trader'],
      },
      null,
    ]);
  });
});

describe('getUserIdentityByUsername', () => {
  it('resolves with users details', async () => {
    // MOCK HTTP RESPONSES
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
          access_token: 'access_token',
          expires_in: 1800,
          refresh_expires_in: 1800,
          refresh_token: 'refresh_token',
          token_type: 'bearer',
          'not-before-policy': 0,
          session_state: '9d23c1d1-73a0-436f-9b36-6720783cf109',
          scope: 'email profile',
        },
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users',
        {
          params: { username: 'testUsername' },
          headers: { Authorization: 'Bearer access_token' },
        },
      )
      .resolves({
        data: {
          id: 'testId1',
          createdTimestamp: 1558733361060,
          username: 'testUsername',
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
      });

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users/testId1/role-mappings/realm',
        { headers: { Authorization: 'Bearer access_token' } },
      )
      .resolves({
        data: [
          {
            id: 'efb2f091-01be-4aae-ad90-9aad2def65ee',
            name: 'offline_access',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: '8b54f81f-4203-44fe-b002-83a72c4e708a',
            name: 'uma_authorization',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
          {
            id: 'f4b0c5cd-6c34-46fe-8cb1-73f9a387adbb',
            name: 'trader',
            composite: false,
            clientRole: false,
            containerId: 'main',
          },
        ],
      });
    // END: MOCK HTTP RESPONSES

    const users = await app.useCases.getUserIdentityByUsername('testUsername');
    expect(users).toEqual({
      id: 'testId1',
      email: 'test1@test.com',
      username: 'testUsername',
      roles: ['offline_access', 'uma_authorization', 'trader'],
    });
  });

  it('rejects when not found', async () => {
    const error = new Error();
    error.response = {
      data: {},
      status: 404,
      headers: {},
    };

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users',
        sinon.match({
          params: { username: 'testUsername2' },
        }),
      )
      .rejects(error);

    await expect(app.useCases.getUserIdentityByUsername('testUsername2')).rejects.toThrow('Cannot find user');
  });

  it('rejects when http errors', async () => {
    const error = new Error();
    error.response = {
      data: {},
      status: 503,
      headers: {},
    };

    mockAxios.get
      .withArgs(
        'http://test.com/auth/admin/realms/main/users',
        sinon.match({
          params: { username: 'testUsername3' },
        }),
      )
      .rejects(error);

    await expect(app.useCases.getUserIdentityByUsername('testUsername3')).rejects.toThrow('Internal error');
  });
});
