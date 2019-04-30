const { graphql } = require('graphql');

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
          keys: [
            'bio',
            {
              key: 'profilePhoto',
              size: 'thumbnail',
            },
          ],
        },
        {
          userID: 'user2',
          keys: [
            'bio',
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
          bio: 'this is my bio',
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
          bio: 'this is my bio 2',
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

  const context = { auth: {} };
  const resp = await graphql({ schema, source, context });
  console.log(resp);
});

test('getExchangeKeys', () => {
  const source = `
  
  `;

  const context = { auth: {} };
  graphql({ schema, source, context });
});

test('updateUser', () => {

});

test('addExchangeKeys', () => {

});

test('deleteExchangeKeys', () => {

});

test('signUpload', () => {

});
