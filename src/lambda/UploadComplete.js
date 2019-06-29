const AWS = require('aws-sdk');
const app = require('../../src/app.bootstrap');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

exports.handler = async function (event) {
  const promises = event.Records.map(async (record) => {
    const Bucket = record.s3.bucket.name;
    const Key = record.s3.object.key;
    const { Metadata } = await s3.headObject({ Bucket, Key }).promise();

    const dataKey = Metadata.key;
    const userID = Metadata.userid;

    const url = `https://${Bucket}.s3.amazonaws.com/${Key}`;

    console.log(JSON.stringify({
      Bucket,
      Key,
      Metadata,
      url,
      userID,
      dataKey,
    }));
    await app.controllers.newImageUpload({ url, userID, key: dataKey });
  });

  return Promise.all(promises);
};
