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
          keys: ['bio'],
        },
        {
          userID: 'user2',
          keys: ['bio'],
        },
      ],
    })
    .resolves([
      {
        userID: 'user1',
        data: {
          bio: 'this is my bio',
        },
      },
      {
        userID: 'user2',
        data: {
          bio: 'this is my bio',
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

  const source = `{
    getUsers(ids: ["user1", "user2"]) {
      id
      bio
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
        bio: 'this is my bio',
        profilePhoto: {
          url: 'http://example.com/thumbnail.png',
          width: 150,
          height: 150,
        },
      },
      {
        id: 'user2',
        bio: 'this is my bio',
        profilePhoto: {
          url: 'http://example.com/thumbnail2.png',
          width: 150,
          height: 150,
        },
      },
    ]);
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

});

test('addExchangeKeys', async () => {

});

test('deleteExchangeKeys', async () => {

});

test('signUpload', async () => {

});
