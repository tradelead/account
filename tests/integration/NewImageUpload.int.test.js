const app = require('../../src/app.bootstrap');

describe('new image upload controller', () => {
  const imageReq = {
    url: 'https://via.placeholder.com/700x500.png',
    key: 'profilePhoto',
    userID: 'user123',
  };

  it('regenerates resized image when image changes', async () => {
    await app.controllers.newImageUpload(imageReq);
    const { userID, key } = imageReq;

    // generates another size
    await app.useCases.getAccountData({
      data: [{ userID, keys: [{ key, size: 'thumbnail' }] }],
    });

    // redo
    imageReq.url = 'https://via.placeholder.com/1200x500.png';
    await app.controllers.newImageUpload(imageReq);
    const [accountData] = await app.useCases.getAccountData({
      data: [{ userID, keys: [{ key, size: 'thumbnail' }] }],
    });

    const filename = accountData.data[key].url.split('/').pop();
    expect(filename).toEqual('1200x500-150x150.png');
  });
});
