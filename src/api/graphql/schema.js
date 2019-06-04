const gql = require('graphql-tag');
const { makeExecutableSchema } = require('graphql-tools');
const { GraphQLScalarType, GraphQLError, Kind } = require('graphql');
const Dataloader = require('dataloader');
const graphqlFields = require('graphql-fields');
const app = require('../../app.bootstrap');

const AnyObject = new GraphQLScalarType({
  name: 'AnyObject',
  description: 'Any JSON object. This type bypasses type checking.',
  serialize: value => value,
  parseValue: value => value,
  parseLiteral: (ast) => {
    if (ast.kind !== Kind.OBJECT) {
      throw new GraphQLError(`Query error: Can only parse object but got a: ${ast.kind}`, [ast]);
    }
    return ast.value;
  },
});

// generate enum with profile image sizes
const profilePhotoSizes = Object.keys(app.accountDataConfig.profilePhoto.sizes);
const gqlProfilePhotoSizesEnum = gql`
enum ProfileImageSizes {
  ${profilePhotoSizes.join('\n')}
}
`;

const typeDefs = gql`
scalar AnyObject 
${gqlProfilePhotoSizesEnum}

type Image {
  url: String!
  width: Int!
  height: Int!
}

type User {
  id: ID!
  profilePhoto(size: ProfileImageSizes): Image
  bio: String
  website: String
}

type ExchangeKey {
  exchangeID: ID!
  tokenLast4: String!
  "only returned when authenticated as system role"
  token: String
  secretLast4: String!
  "only returned when authenticated as system role"
  secret: String
}

type Query {
  getUsers(ids: [ID!]!): [User]!
  "If exchangeIDs is empty, then all exchange keys are returned"
  getExchangeKeys(userID: ID!, exchangeIDs: [ID!]): [ExchangeKey]
}

input UpdateUserInput {
  bio: String
  website: String
}

input AddExchangeKeyInput {
  userID: ID!
  exchangeID: ID!
  token: String!
  secret: String!
}

type SignedUpload {
  url: String!
  """
  These { key: value } fields must be included in the post upload. 
  The field 'Content-Type' must also be passed with a valid image mime (image/png, image/jpeg, etc).
  """
  fields: AnyObject!
}

type Mutation {
  updateUser(id: ID!, input: UpdateUserInput!): Boolean
  addExchangeKeys(input: AddExchangeKeyInput): Boolean
  deleteExchangeKeys(userID: ID!, exchangeID: ID!): Boolean
  signUpload(userID: ID!, key: String!): SignedUpload
}

schema {
  query: Query
  mutation: Mutation
}
`;

const userDataLoader = new Dataloader(async (items) => {
  // consolidate items to fetch
  const data = Object.values(items.reduce((acc, item) => {
    acc[item.id] = acc[item.id] || { userID: item.id, keys: [] };

    if (item.type === 'user') {
      const keys = Object
        .keys(item.fields)
        .filter(key => (
          key !== 'id'
          && app.accountDataConfig[key]
          && app.accountDataConfig[key].type !== 'image'
        ));
      acc[item.id].keys.push(...keys);
    } else if (item.type === 'field') {
      if (item.input) {
        acc[item.id].keys.push({
          key: item.key,
          ...item.input,
        });
      } else {
        acc[item.id].keys.push(item.key);
      }
    }

    return acc;
  }, {}));

  // fetch account data
  const accountData = await app.useCases.getAccountData({ data });

  const accountDataObj = accountData.reduce((acc, resp) => {
    const { userID } = resp;
    acc[userID] = resp.data;
    return acc;
  }, {});

  // map account data to input orders
  return items.map((item) => {
    const userData = accountDataObj[item.id];
    if (item.type === 'user') {
      return {
        id: item.id,
        ...userData,
      };
    }

    if (item.type === 'field') {
      return {
        id: item.id,
        ...userData[item.key],
      };
    }

    return { id: item.id };
  });
});

const resolvers = {
  Query: {
    async getUsers(root, { ids }, _, info) {
      const fields = graphqlFields(info);
      const promises = ids.map(async id => userDataLoader.load({
        type: 'user',
        id,
        fields,
      }));

      return Promise.all(promises);
    },
    async getExchangeKeys(root, { userID, exchangeIDs }, context) {
      return app.useCases.getExchangeKeys({ auth: context.auth, userID, exchangeIDs });
    },
  },
  User: {
    async profilePhoto(user, input) {
      return userDataLoader.load({
        type: 'field',
        id: user.id,
        key: 'profilePhoto',
        input,
      });
    },
  },
  Mutation: {
    async updateUser(root, { id, input }, context) {
      await app.useCases.updateAccountData({
        auth: context.auth,
        userID: id,
        data: input,
      });
      return true;
    },
    async addExchangeKeys(root, { input }, context) {
      await app.useCases.addExchangeKeys({
        auth: context.auth,
        ...input,
      });

      return true;
    },
    async deleteExchangeKeys(root, { userID, exchangeID }, context) {
      await app.useCases.deleteExchangeKeys({ auth: context.auth, userID, exchangeID });
      return true;
    },
    async signUpload(root, { userID, key }, context) {
      return app.useCases.signUpload({ auth: context.auth, userID, key });
    },
  },
  AnyObject,
};

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers,
});
