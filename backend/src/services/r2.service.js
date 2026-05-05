const { Injectable } = require('@nestjs/common');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { r2Config } = require('../config/r2.config');

@Injectable()
class R2Service {
  constructor() {
    this.s3Client = new S3Client({
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
      region: 'auto',
    });
  }

  async uploadFile(key, body, contentType) {
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await this.s3Client.send(command);
  }

  async getSignedDownloadUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getSignedUploadUrl(key, contentType, expiresIn = 3600) {
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    });
    await this.s3Client.send(command);
  }

  async fileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key) {
    return `${r2Config.publicUrl}/${key}`;
  }
}

module.exports = { R2Service };
