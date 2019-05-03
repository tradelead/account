const StackName = process.argv[2];

if (!StackName) {
  console.log('Stack name is required.');
  process.exit(1);
}

const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

(async () => {
  const cloudformation = new AWS.CloudFormation({ apiVersion: '2010-05-15' });
  const { Stacks } = await cloudformation.describeStacks({ StackName }).promise();
  const outputs = Stacks[0].Outputs.reduce((acc, Output) => {
    acc[Output.OutputKey] = Output.OutputValue;
    return acc;
  }, {});

  if (!outputs.AccountMediaBucket) {
    console.log('Cannot find output "AccountMediaBucket".');
    process.exit(1);
  }

  if (!outputs.UploadCompleteArn) {
    console.log('Cannot find output "UploadCompleteArn".');
    process.exit(1);
  }

  const params = {
    Bucket: outputs.AccountMediaBucket,
    NotificationConfiguration: {
      LambdaFunctionConfigurations: [
        {
          Events: ['s3:ObjectCreated:*'],
          LambdaFunctionArn: outputs.UploadCompleteArn,
        },
      ],
    },
  };

  await s3.putBucketNotificationConfiguration(params).promise();
})().catch((e) => {
  throw e;
});
