const mime = require('mime-types');

module.exports = class SaveFile {
  constructor({ s3, bucket }) {
    this.s3 = s3;
    this.bucket = bucket;
  }

  async execute({ buf, filepath }) {
    await this.s3.putObject({
      ACL: 'public-read',
      Bucket: this.bucket,
      Key: filepath,
      Body: buf,
      ContentType: mime.lookup(filepath),
    }).promise();

    return `https://${this.bucket}.s3.amazonaws.com/${filepath}`;
  }
};
