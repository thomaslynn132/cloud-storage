const { Injectable, NotFoundException } = require('@nestjs/common');
const { InjectRepository } = require('@nestjs/typeorm');
const { Repository } = require('typeorm');
const { File } = require('../../../entities/file.entity');
const { User } = require('../../../entities/user.entity');
const { R2Service } = require('../../../services/r2.service');
const { HashService } = require('../../../services/hash.service');
const { FileService } = require('../file/services/file.service');
const { appConfig } = require('../../../config/app.config');

@Injectable()
class UploadService {
  uploadSessions = new Map();

  constructor(
    @InjectRepository(File)
    private fileRepository,
    @InjectRepository(User)
    private userRepository,
    private r2Service,
    private hashService,
    private fileService,
  ) {}

  async initUpload(userId, dto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const storageLimit = this.getStorageLimit(user.planType);
    if (user.storageUsed + dto.fileSize > storageLimit) {
      throw new Error('Storage limit exceeded');
    }

    const existingFile = await this.fileService.findFileByHash(dto.fileHash);
    if (existingFile) {
      const file = await this.fileService.createFile(
        userId,
        dto.fileName,
        dto.fileSize,
        dto.fileHash,
        existingFile.storageKey,
        dto.isPermanent || false,
      );
      return {
        fileId: file.id,
        storageKey: existingFile.storageKey,
        uploadUrl: await this.r2Service.getSignedUploadUrl(existingFile.storageKey, 'application/octet-stream'),
        isDuplicate: true,
      };
    }

    const storageKey = this.hashService.generateStorageKey(userId, dto.fileName, dto.fileHash);
    const uploadUrl = await this.r2Service.getSignedUploadUrl(storageKey, 'application/octet-stream');

    const uploadId = Math.random().toString(36).substring(2, 15);
    this.uploadSessions.set(uploadId, {
      chunks: 0,
      storageKey,
      userId,
    });

    return {
      uploadId,
      storageKey,
      uploadUrl,
      isDuplicate: false,
    };
  }

  async completeUpload(userId, dto) {
    const session = this.uploadSessions.get(dto.uploadId);
    if (!session || session.userId !== userId) {
      throw new Error('Invalid upload session');
    }

    const file = await this.fileService.createFile(
      userId,
      dto.storageKey.split('/').pop(),
      0,
      '',
      dto.storageKey,
      false,
    );

    this.uploadSessions.delete(dto.uploadId);

    return { fileId: file.id, message: 'Upload completed successfully' };
  }

  getStorageLimit(planType) {
    switch (planType) {
      case 'paid':
        return appConfig.proStorageLimit;
      default:
        return appConfig.freeStorageLimit;
    }
  }
}

module.exports = { UploadService };
