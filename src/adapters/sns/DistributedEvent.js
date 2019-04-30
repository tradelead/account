module.exports = class DistributedEvent {
  constructor({ sns, topicArn }) {
    this.sns = sns;
    this.topicArn = topicArn;
  }

  async emit(data) {
    await this.sns.publish({
      Message: JSON.stringify(data),
      TopicArn: this.topicArn,
    }).promise();
  }
};
