const AWS = require('aws-sdk');
const app = require('../../src/app.bootstrap');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

exports.handler = async function (event) {
  const promises = event.Records.map(async (record) => {
    const Bucket = record.s3.bucket.name;
    const Key = record.s3.object.key;
    const { Metadata } = await s3.headObject({ Bucket, Key }).promise();

    const dataKey = Metadata['x-amz-meta-key'];
    const userID = Metadata['x-amz-meta-userid'];

    const url = `http(s)://${Bucket}.s3.amazonaws.com/${Key}`;
    await app.controllers.newImageUpload({ url, userID, key: dataKey });
  });

  return Promise.all(promises);
};
