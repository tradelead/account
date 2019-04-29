const { promisify } = require('util');
const crypto = require('crypto');

module.exports = class UploadSigner {
  constructor({ s3, bucket }) {
    this.s3 = s3;
    this.bucket = bucket;
    this.createPresignedPost = promisify(this.s3.createPresignedPost.bind(s3));
  }

  async execute({ userID, key }) {
    return this.createPresignedPost({
      Bucket: this.bucket,
      Fields: {
        acl: 'public-read',
        key: `${userID}-${crypto.randomBytes(32).toString('hex')}`,
        'x-amz-meta-userID': userID,
        'x-amz-meta-key': key,
      },
      Conditions: [
        ['starts-with', '$Content-Type', 'image/'], // only images
        ['content-length-range', 0, 5000000], // 5 MB
      ],
    });
  }
};
