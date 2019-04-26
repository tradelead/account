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
    app.useCases.updateAccountData(req);

    const { auth, userID } = req;
    const keys = ['bio'];
    const [data] = app.useCases.getAccountData([{ auth, userID, keys }]);
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
});

describe('get profilePhoto', () => {
  it('can get profilePhoto', async () => {

  });

  it('can get profilePhoto cropped as thumbnail', async () => {

  });

  it('can get profilePhoto cropped to small', async () => {

  });
});
