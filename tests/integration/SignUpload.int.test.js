const { promisify } = require('util');
const parseUrl = require('url').parse;
const https = require('https');
const FormData = require('form-data');
const app = require('../../src/app.bootstrap');

describe('SignUpload', () => {
  let uploadReq;

  beforeEach(() => {
    uploadReq = {
      auth: {
        id: 'user123',
        email: 'user@email.com',
        username: 'testuser',
        roles: ['trader'],
      },
      userID: 'user123',
      key: 'profilePhoto',
    };
  });

  it('has public access', async () => {
    const signedUpload = await app.useCases.signUpload(uploadReq);
    expect(signedUpload.fields.acl).toEqual('public-read');
  });

  it('has correct key', async () => {
    const signedUpload = await app.useCases.signUpload(uploadReq);
    expect(signedUpload.fields['x-amz-meta-key']).toEqual(uploadReq.key);
  });

  it('has correct userID', async () => {
    const signedUpload = await app.useCases.signUpload(uploadReq);
    expect(signedUpload.fields['x-amz-meta-userID']).toEqual(uploadReq.userID);
  });

  it('uploads successfully', async () => {
    const signedUpload = await app.useCases.signUpload(uploadReq);

    const form = new FormData();

    Object.keys(signedUpload.fields).forEach((key) => {
      form.append(key, signedUpload.fields[key]);
    });

    const imageRes = await (new Promise((resolve) => {
      https.get('https://via.placeholder.com/700x500.png', (res) => {
        resolve(res);
      });
    }));

    form.append('Content-Type', 'image/png');
    form.append('file', imageRes, { contentType: 'image/png' });

    const submit = promisify(form.submit.bind(form));

    const params = parseUrl(signedUpload.url);
    const res = await submit({ ...params });

    res.on('data', (chunk) => {
      console.log(chunk.toString());
    });

    expect(res.statusCode).toBeLessThanOrEqual(299);
  });

  it('throws error when auth.id doesn\'t match userID', async () => {
    uploadReq.userID = 'user234';
    await expect(app.useCases.signUpload(uploadReq)).rejects.toThrow();
  });

  it('throws error when not authenticated', async () => {
    uploadReq.auth = null;
    await expect(app.useCases.signUpload(uploadReq)).rejects.toThrow();
  });
});
