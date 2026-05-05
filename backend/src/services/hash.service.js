const { Injectable } = require('@nestjs/common');
const crypto = require('crypto');
const { createReadStream } = require('fs');

@Injectable()
class HashService {
  calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  calculateHashFromStream(stream) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  generateStorageKey(userId, fileName, hash) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${userId}/${timestamp}-${random}-${fileName}`;
  }
}

module.exports = { HashService };
