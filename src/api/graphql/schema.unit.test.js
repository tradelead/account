const { graphql } = require('graphql');
const sinon = require('sinon');

jest.mock('../../app.bootstrap');

const schema = require('./schema');
const app = require('../../app.bootstrap');

test('getUsers with profilePhoto', async () => {
  // mock response
  app.useCases.getAccountData
    .withArgs({
      data: [
        {
          userID: 'user1',
          keys: ['bio', 'website'],
        },
        {
          userID: 'user2',
          keys: ['bio', 'website'],
        },
      ],
    })
    .resolves([
      {
        userID: 'user1',
        data: {
          bio: 'this is my bio',
          website: 'http://test.com',
        },
      },
      {
        userID: 'user2',
        data: {
          bio: 'this is my bio',
          website: 'http://test.com',
        },
      },
    ]);

  app.useCases.getAccountData
    .withArgs({
      data: [
        {
          userID: 'user1',
          keys: [
            {
              key: 'profilePhoto',
              size: 'thumbnail',
            },
          ],
        },
        {
          userID: 'user2',
          keys: [
            {
              key: 'profilePhoto',
              size: 'thumbnail',
            },
          ],
        },
      ],
    })
    .resolves([
      {
        userID: 'user1',
        data: {
          profilePhoto: {
            url: 'http://example.com/thumbnail.png',
            width: 150,
            height: 150,
          },
        },
      },
      {
        userID: 'user2',
        data: {
          profilePhoto: {
            url: 'http://example.com/thumbnail2.png',
            width: 150,
            height: 150,
          },
        },
      },
    ]);

  app.useCases.getUserIdentities
    .withArgs(['user1', 'user2'])
    .resolves([
      {
        id: 'user1',
        username: 'testname',
        email: 'test@test.com',
        roles: ['trader', 'test'],
      },
      {
        id: 'user2',
        username: 'testname2',
        email: 'test2@test.com',
        roles: ['trader', 'test'],
      },
    ]);

  const source = `{
    getUsers(ids: ["user1", "user2"]) {
      id
      username
      email
      roles
      bio
      website
      profilePhoto(size: thumbnail) {
        url
        width
        height
      }
    }
  }`;

  const resp = await graphql({
    schema,
    source,
  });

  expect(resp.data.getUsers)
    .toEqual([
      {
        id: 'user1',
        username: 'testname',
        email: 'test@test.com',
        roles: ['trader', 'test'],
        bio: 'this is my bio',
        website: 'http://test.com',
        profilePhoto: {
          url: 'http://example.com/thumbnail.png',
          width: 150,
          height: 150,
        },
      },
      {
        id: 'user2',
        username: 'testname2',
        email: 'test2@test.com',
        roles: ['trader', 'test'],
        bio: 'this is my bio',
        website: 'http://test.com',
        profilePhoto: {
          url: 'http://example.com/thumbnail2.png',
          width: 150,
          height: 150,
        },
      },
    ]);
});

test('GetUserByUsername', async () => {
  // mock response
  app.useCases.getUserIdentityByUsername
    .withArgs('testname')
    .resolves(
      {
        id: 'user1',
        username: 'testname',
        email: 'test@test.com',
        roles: ['trader', 'test'],
      },
    );

  app.useCases.getAccountData
    .withArgs({
      data: [
        {
          userID: 'user1',
          keys: ['bio', 'website'],
        },
      ],
    })
    .resolves([
      {
        userID: 'user1',
        data: {
          bio: 'this is my bio',
          website: 'http://test.com',
        },
      },
    ]);

  app.useCases.getAccountData
    .withArgs({
      data: [
        {
          userID: 'user1',
          keys: [
            {
              key: 'profilePhoto',
              size: 'thumbnail',
            },
          ],
        },
      ],
    })
    .resolves([
      {
        userID: 'user1',
        data: {
          profilePhoto: {
            url: 'http://example.com/thumbnail.png',
            width: 150,
            height: 150,
          },
        },
      },
    ]);

  const source = `{
    getUserByUsername(username: "testname") {
      id
      username
      email
      roles
      bio
      website
      profilePhoto(size: thumbnail) {
        url
        width
        height
      }
    }
  }`;

  const resp = await graphql({
    schema,
    source,
  });

  expect(resp.data.getUserByUsername)
    .toEqual(
      {
        id: 'user1',
        username: 'testname',
        email: 'test@test.com',
        roles: ['trader', 'test'],
        bio: 'this is my bio',
        website: 'http://test.com',
        profilePhoto: {
          url: 'http://example.com/thumbnail.png',
          width: 150,
          height: 150,
        },
      },
    );
});

test('getExchangeKeys', async () => {
  app.useCases.getExchangeKeys
    .withArgs(sinon.match({
      auth: { test: 1 },
      userID: 'user1',
      exchangeIDs: ['exchange1', 'exchange2'],
    }))
    .resolves([
      {
        exchangeID: 'exchange1',
        tokenLast4: 'n123',
        secretLast4: 't123',
        token: null,
        secret: null,
      },
      {
        exchangeID: 'exchange2',
        tokenLast4: 'n234',
        secretLast4: 't234',
        token: null,
        secret: null,
      },
    ]);

  const source = `{
    getExchangeKeys(userID: "user1", exchangeIDs: ["exchange1", "exchange2"]) {
      exchangeID
      tokenLast4
      secretLast4
      token
      secret
    }
  }`;

  const context = { auth: { test: 1 } };
  const resp = await graphql(
    schema,
    source,
    null,
    context,
  );

  expect(resp.data.getExchangeKeys).toEqual([
    {
      exchangeID: 'exchange1',
      tokenLast4: 'n123',
      secretLast4: 't123',
      token: null,
      secret: null,
    },
    {
      exchangeID: 'exchange2',
      tokenLast4: 'n234',
      secretLast4: 't234',
      token: null,
      secret: null,
    },
  ]);
});

test('updateUser', async () => {
  const source = `mutation {
    updateUser(id: "user1", input: { bio: "Test Bio", website: "http://test.com" })
  }`;

  const context = { auth: { test: 1 } };
  await graphql(
    schema,
    source,
    null,
    context,
  );

  sinon.assert.calledWith(app.useCases.updateAccountData, {
    auth: context.auth,
    userID: 'user1',
    data: {
      bio: 'Test Bio',
      website: 'http://test.com',
    },
  });
});

test('addExchangeKeys', async () => {
  const source = `mutation {
    addExchangeKeys(input: { 
      userID: "user1",
      exchangeID: "exchange1",
      token: "token123",
      secret: "secret123",
    })
  }`;

  const context = { auth: { test: 1 } };
  await graphql(
    schema,
    source,
    null,
    context,
  );

  sinon.assert.calledWith(app.useCases.addExchangeKeys, {
    auth: context.auth,
    userID: 'user1',
    exchangeID: 'exchange1',
    token: 'token123',
    secret: 'secret123',
  });
});

test('deleteExchangeKeys', async () => {
  const source = `mutation {
    deleteExchangeKeys(userID: "user1", exchangeID: "exchange1")
  }`;

  const context = { auth: { test: 1 } };
  await graphql(
    schema,
    source,
    null,
    context,
  );

  sinon.assert.calledWith(app.useCases.deleteExchangeKeys, {
    auth: context.auth,
    userID: 'user1',
    exchangeID: 'exchange1',
  });
});

test('signUpload', async () => {
  app.useCases.signUpload
    .withArgs(sinon.match({
      auth: { test: 1 },
      userID: 'user1',
      key: 'profilePhoto',
    }))
    .resolves({
      url: 'http://testurl.com',
      fields: {
        randomA: '1',
        randomB: '2',
      },
    });

  const source = `mutation {
    signUpload(userID: "user1", key: "profilePhoto") {
      url
      fields
    }
  }`;

  const context = { auth: { test: 1 } };
  const res = await graphql(
    schema,
    source,
    null,
    context,
  );

  expect(res.data.signUpload).toEqual({
    url: 'http://testurl.com',
    fields: {
      randomA: '1',
      randomB: '2',
    },
  });
});

test('getExchanges', async () => {
  const source = `query {
    getExchanges {
      exchangeID
      exchangeLabel
    }
  }`;

  const context = {};
  const res = await graphql(
    schema,
    source,
    null,
    context,
  );

  expect(res.data.getExchanges).toEqual([
    {
      exchangeID: 'binance',
      exchangeLabel: 'Binance',
    },
    {
      exchangeID: 'bittrex',
      exchangeLabel: 'Bittrex',
    },
  ]);
});
