const app = require('../../src/app.bootstrap');
const flushDBs = require('./flushDBs');

jest.mock('../../src/validExchanges', () => ([
  {
    exchangeID: 'binance',
    exchangeLabel: 'Binance',
  },
  {
    exchangeID: 'bittrex',
    exchangeLabel: 'Bittrex',
  },
]));

let req = {};

beforeEach(async () => {
  req = {
    auth: {
      id: 'user123',
      roles: ['trader'],
    },
    userID: 'user123',
    exchangeID: 'binance',
    token: 'token123',
    secret: 'secret123',
  };

  await flushDBs();
});

describe('addExchangeKeys', () => {
  it('adds exchange keys when authenticated as owner', async () => {
    await expect(app.useCases.addExchangeKeys(req)).resolves.toEqual(true);

    const { auth, userID, exchangeID } = req;
    const [key] = await app.useCases.getExchangeKeys({ auth, userID, exchangeIDs: [exchangeID] });

    expect(key.exchangeID).toEqual(exchangeID);
  });

  it('emits addedExchangeKeys event', async () => {
    let emitted = false;
    app.events.once('addedExchangeKeys', (data) => { emitted = data; });

    await app.useCases.addExchangeKeys(req);

    const { userID, exchangeID } = req;
    expect(emitted).toEqual({ userID, exchangeID });
  });

  it('throws error when not a valid exchange', async () => {
    req.exchangeID = 'notAValidExchange';
    await expect(app.useCases.addExchangeKeys(req))
      .rejects.toThrow('"Exchange ID" must be one of [binance, bittrex]');
  });

  it('throws error when trader exchange already exists', async () => {
    await app.useCases.addExchangeKeys(req);

    await expect(app.useCases.addExchangeKeys(req))
      .rejects.toThrow('Keys for that exchange already exists');
  });

  it('throws error when not authenticated', async () => {
    req.auth = null;
    await expect(app.useCases.addExchangeKeys(req))
      .rejects.toThrow('Invalid permissions');
  });

  it('throws error when accessing other trader\'s exchange keys', async () => {
    req.userID = 'user234';
    await expect(app.useCases.addExchangeKeys(req))
      .rejects.toThrow('Invalid permissions');
  });
});

describe('getExchangeKeys', () => {
  beforeEach(async () => {
    await app.useCases.addExchangeKeys(req);

    req.exchangeID = 'bittrex';
    await app.useCases.addExchangeKeys(req);
  });

  it('returns all keys when exchangeIDs not specified', async () => {
    const { auth, userID } = req;
    await expect(app.useCases.getExchangeKeys({ auth, userID })).resolves.toHaveLength(2);
  });

  it('returns keys for specified exchangeIDs', async () => {
    const { auth, userID } = req;
    const keys = await app.useCases.getExchangeKeys({ auth, userID, exchangeIDs: ['bittrex'] });

    expect(keys).toHaveLength(1);
    expect(keys[0].exchangeID).toEqual('bittrex');
  });

  it('returns masked keys when authenticated as owner', async () => {
    const { auth, userID } = req;
    const [key] = await app.useCases.getExchangeKeys({ auth, userID });

    expect(key.tokenLast4).toEqual('n123');
    expect(key.secretLast4).toEqual('t123');
    expect(key.token).toBeFalsy();
    expect(key.secret).toBeFalsy();
  });

  it('returns plain text keys when authenticated as system', async () => {
    const { auth, userID } = req;
    auth.roles.push('system');
    const [key] = await app.useCases.getExchangeKeys({ auth, userID });

    expect(key.token).toEqual('token123');
    expect(key.secret).toEqual('secret123');
  });

  it('throws error when accessing other trader\'s exchange keys', async () => {
    const { auth } = req;
    await expect(app.useCases.getExchangeKeys({ auth, userID: 'user234' }))
      .rejects.toThrow('Invalid permissions');
  });

  it('throws error when not authenticated', async () => {
    const { userID } = req;
    await expect(app.useCases.getExchangeKeys({ auth: null, userID }))
      .rejects.toThrow('Invalid permissions');

    await expect(app.useCases.getExchangeKeys({ auth: {}, userID }))
      .rejects.toThrow('Invalid permissions');
  });
});

describe('deleteExchangeKeys', () => {
  it('deletes exchange keys when authenticated as owner', async () => {
    await app.useCases.addExchangeKeys(req);

    const { auth, userID, exchangeID } = req;
    await expect(app.useCases.deleteExchangeKeys({ auth, userID, exchangeID }))
      .resolves.toEqual(true);

    const [key] = await app.useCases.getExchangeKeys({ auth, userID, exchangeIDs: [exchangeID] });
    expect(key).toBeFalsy();
  });

  it('emits deletedExchangeKeys event', async () => {
    let emitted = false;
    app.events.once('deletedExchangeKeys', (data) => { emitted = data; });

    const { auth, userID, exchangeID } = req;
    await app.useCases.deleteExchangeKeys({ auth, userID, exchangeID });

    expect(emitted).toEqual({ userID, exchangeID });
  });

  it('throws error when not authenticated', async () => {
    const { userID, exchangeID } = req;
    await expect(app.useCases.deleteExchangeKeys({ auth: null, userID, exchangeID }))
      .rejects.toThrow('Invalid permissions');
  });

  it('throws error when accessing other trader\'s exchange keys', async () => {
    const { auth, exchangeID } = req;
    await expect(app.useCases.deleteExchangeKeys({ auth, userID: 'user234', exchangeID }))
      .rejects.toThrow('Invalid permissions');
  });
});
