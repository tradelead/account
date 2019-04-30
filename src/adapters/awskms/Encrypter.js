module.exports = class Encrypter {
  constructor({ kms, cmkID }) {
    this.kms = kms;
    this.cmkID = cmkID;
  }

  async encrypt(Plaintext) {
    const res = await this.kms.encrypt({ KeyId: this.cmkID, Plaintext }).promise();
    return res.CiphertextBlob;
  }

  async decrypt(CiphertextBlob) {
    const res = await this.kms.decrypt({ CiphertextBlob }).promise();
    return res.Plaintext.toString();
  }
};
