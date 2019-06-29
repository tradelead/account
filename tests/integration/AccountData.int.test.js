const fetch = require('node-fetch');
const app = require('../../src/app.bootstrap');

describe('update and get bio', () => {
  let req = {};

  beforeEach(() => {
    req = {
      auth: {
        id: 'user123',
        email: 'user@email.com',
        username: 'testuser',
        roles: ['trader'],
      },
      userID: 'user123',
      data: {
        bio: 'this is my new bio',
      },
    };
  });

  it('updates trader bio when authenticated', async () => {
    await app.useCases.updateAccountData(req);

    const { userID } = req;
    const keys = ['bio'];
    const [accountData] = await app.useCases.getAccountData({ data: [{ userID, keys }] });
    expect(accountData).toHaveProperty('data.bio', req.data.bio);
  });

  it('updates trader bio with empty string when authenticated', async () => {
    req.data.bio = '';
    await app.useCases.updateAccountData(req);

    const { userID } = req;
    const keys = ['bio'];
    const [accountData] = await app.useCases.getAccountData({ data: [{ userID, keys }] });
    expect(accountData).toHaveProperty('data.bio', req.data.bio);
  });

  it('throws error when updating other trader bio when authenticated', async () => {
    req.userID = 'user234';
    await expect(app.useCases.updateAccountData(req)).rejects.toThrow('Invalid permissions');
  });

  it('throws error when update bio when not authenticated', async () => {
    req.auth = null;
    await expect(app.useCases.updateAccountData(req)).rejects.toThrow('Invalid permissions');
  });

  it('get bio when not authenticated', async () => {
    app.useCases.updateAccountData(req);

    const { userID } = req;
    const keys = ['bio'];
    const [accountData] = await app.useCases.getAccountData({ data: [{ userID, keys }] });
    expect(accountData).toHaveProperty('data.bio', req.data.bio);
  });
});

describe('update and get website', () => {
  let req = {};

  beforeEach(() => {
    req = {
      auth: {
        id: 'user123',
        email: 'user@email.com',
        username: 'testuser',
        roles: ['trader'],
      },
      userID: 'user123',
      data: {
        website: 'http://test.com',
      },
    };
  });

  it('updates when authenticated', async () => {
    await app.useCases.updateAccountData(req);

    const { userID } = req;
    const keys = ['website'];
    const [accountData] = await app.useCases.getAccountData({ data: [{ userID, keys }] });
    expect(accountData).toHaveProperty('data.website', req.data.website);
  });

  it('updates when url doesn\'t contain protocol and defaults to http', async () => {
    req.data.website = 'test.com';
    await app.useCases.updateAccountData(req);

    const { userID } = req;
    const keys = ['website'];
    const [accountData] = await app.useCases.getAccountData({ data: [{ userID, keys }] });
    expect(accountData).toHaveProperty('data.website', 'http://test.com');
  });

  it('updates when empty', async () => {
    req.data.website = '';
    await app.useCases.updateAccountData(req);

    const { userID } = req;
    const keys = ['website'];
    const [accountData] = await app.useCases.getAccountData({ data: [{ userID, keys }] });
    expect(accountData).toHaveProperty('data.website', req.data.website);
  });

  it('throws error when updating with invalid url', async () => {
    req.data.website = 'thisisnotavalidtld.cmo';
    await expect(app.useCases.updateAccountData(req)).rejects.toThrow('"website" must be valid domain or url.');
  });

  it('throws error when updating other trader when authenticated', async () => {
    req.userID = 'user234';
    await expect(app.useCases.updateAccountData(req)).rejects.toThrow('Invalid permissions');
  });

  it('throws error when updating and not authenticated', async () => {
    req.auth = null;
    await expect(app.useCases.updateAccountData(req)).rejects.toThrow('Invalid permissions');
  });

  it('get when not authenticated', async () => {
    app.useCases.updateAccountData(req);

    const { userID } = req;
    const keys = ['website'];
    const [accountData] = await app.useCases.getAccountData({ data: [{ userID, keys }] });
    expect(accountData).toHaveProperty('data.website', req.data.website);
  });
});

describe('get profilePhoto', () => {
  const imageReq = {
    url: 'https://via.placeholder.com/700x500.png',
    key: 'profilePhoto',
    userID: 'user123',
  };

  beforeAll(async () => {
    await app.controllers.newImageUpload(imageReq);
  });

  it('can get profilePhoto', async () => {
    const { userID } = imageReq;
    const [accountData] = await app.useCases.getAccountData({
      data: [{ userID, keys: [{ key: 'profilePhoto' }] }],
    });

    expect(accountData.data.profilePhoto.url).toEqual(imageReq.url);
    expect(accountData.data.profilePhoto.width).toEqual(700);
    expect(accountData.data.profilePhoto.height).toEqual(500);
  });

  it('can get profilePhoto cropped as thumbnail', async () => {
    const { userID } = imageReq;
    const [accountData] = await app.useCases.getAccountData({
      data: [{ userID, keys: [{ key: 'profilePhoto', size: 'thumbnail' }] }],
    });

    const res = await fetch(accountData.data.profilePhoto.url);
    expect(res.status).toEqual(200);
    expect(accountData.data.profilePhoto.width).toEqual(150);
    expect(accountData.data.profilePhoto.height).toEqual(150);
  });

  it('can get profilePhoto cropped to small', async () => {
    const { userID } = imageReq;
    const [accountData] = await app.useCases.getAccountData({
      data: [{ userID, keys: [{ key: 'profilePhoto', size: 'medium' }] }],
    });

    const res = await fetch(accountData.data.profilePhoto.url);
    expect(res.status).toEqual(200);
    expect(accountData.data.profilePhoto.width).toEqual(300);
    expect(accountData.data.profilePhoto.height).toEqual(300);
  });
});
