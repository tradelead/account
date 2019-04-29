const fileType = require('file-type');

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
      ContentType: fileType(buf).mime,
    }).promise();

    return `https://${this.bucket}.s3.amazonaws.com/${filepath}`;
  }
};
