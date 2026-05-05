const { Injectable, NotFoundException } = require('@nestjs/common');
const { InjectRepository } = require('@nestjs/typeorm');
const { Repository } = require('typeorm');
const { File } = require('../../../entities/file.entity');
const { User } = require('../../../entities/user.entity');
const { R2Service } = require('../../../services/r2.service');
const { HashService } = require('../../../services/hash.service');
const { appConfig } = require('../../../config/app.config');

@Injectable()
class FileService {
  constructor(
    @InjectRepository(File)
    private fileRepository,
    @InjectRepository(User)
    private userRepository,
    private r2Service,
    private hashService,
  ) {}

  async createFile(userId, fileName, size, hash, storageKey, isPermanent = false) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const storageLimit = this.getStorageLimit(user.planType);
    if (user.storageUsed + size > storageLimit) {
      throw new Error('Storage limit exceeded');
    }

    const expiryDate = isPermanent ? null : new Date(Date.now() + appConfig.freeFileExpiryDays * 24 * 60 * 60 * 1000);

    const file = this.fileRepository.create({
      userId,
      fileName,
      size,
      hash,
      storageKey,
      isPermanent,
      expiryDate,
    });

    await this.fileRepository.save(file);

    user.storageUsed += size;
    await this.userRepository.save(user);

    return file;
  }

  async getFile(fileId, userId) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, isDeleted: false },
      relations: ['user'],
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async getUserFiles(userId) {
    return this.fileRepository.find({
      where: { userId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteFile(fileId, userId) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    file.isDeleted = true;
    await this.fileRepository.save(file);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.storageUsed = Math.max(0, user.storageUsed - file.size);
      await this.userRepository.save(user);
    }

    await this.r2Service.deleteFile(file.storageKey);
  }

  async findFileByHash(hash) {
    return this.fileRepository.findOne({
      where: { hash, isDeleted: false },
    });
  }

  async incrementDownloadCount(fileId) {
    await this.fileRepository.increment({ id: fileId }, 'downloadCount', 1);
  }

  async getExpiredFiles() {
    const { LessThan } = require('typeorm');
    return this.fileRepository.find({
      where: {
        isDeleted: false,
        expiryDate: LessThan(new Date()),
        isPermanent: false,
      },
    });
  }

  async cleanupFile(file) {
    file.isDeleted = true;
    await this.fileRepository.save(file);

    const user = await this.userRepository.findOne({ where: { id: file.userId } });
    if (user) {
      user.storageUsed = Math.max(0, user.storageUsed - file.size);
      await this.userRepository.save(user);
    }

    await this.r2Service.deleteFile(file.storageKey);
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

module.exports = { FileService };
