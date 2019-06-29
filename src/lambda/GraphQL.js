const { ApolloServer } = require('apollo-server-lambda');

const app = require('../../src/app.bootstrap');
const schema = require('../../src/api/graphql/schema');

const context = async ({ event }) => {
  let auth = {};

  try {
    console.log(JSON.stringify(event.headers));
    if (event.headers.Authorization.startsWith('Bearer')) {
      const token = event.headers.Authorization.split(' ').pop();
      auth = await app.services.authService.get(token);
    }
  } catch (e) {
    console.error('error authorizing token', e);
  }

  return {
    auth,
  };
};
const server = new ApolloServer({ schema, context });

exports.handler = server.createHandler();
