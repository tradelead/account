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
    const [data] = await app.useCases.getAccountData({ data: [{ userID, keys }] });
    expect(data).toHaveProperty('bio', req.data.bio);
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
    const [data] = await app.useCases.getAccountData({ data: [{ userID, keys }] });
    expect(data).toHaveProperty('bio', req.data.bio);
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
    const image = await app.useCases.getAccountData({
      data: [{ userID, keys: ['profilePhoto'] }],
    });

    expect(image).toHaveProperty('url', imageReq.url);
    expect(image).toHaveProperty('width', 700);
    expect(image).toHaveProperty('height', 500);
  });

  it('can get profilePhoto cropped as thumbnail', async () => {
    const { userID } = imageReq;
    const image = await app.useCases.getAccountData({
      data: [{ userID, keys: [{ key: 'profilePhoto', size: 'thumbnail' }] }],
    });

    const res = await fetch(imageReq.url);
    expect(res.status).toEqual(200);
    expect(image).toHaveProperty('width', 150);
    expect(image).toHaveProperty('height', 150);
  });

  it('can get profilePhoto cropped to small', async () => {
    const { userID } = imageReq;
    const image = await app.useCases.getAccountData({
      data: [{ userID, keys: [{ key: 'profilePhoto', size: 'medium' }] }],
    });

    const res = await fetch(imageReq.url);
    expect(res.status).toEqual(200);
    expect(image).toHaveProperty('width', 300);
    expect(image).toHaveProperty('height', 300);
  });
});
