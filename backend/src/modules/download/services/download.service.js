const { Injectable, NotFoundException, BadRequestException } = require('@nestjs/common');
const { InjectRepository } = require('@nestjs/typeorm');
const { Repository } = require('typeorm');
const { File } = require('../../../entities/file.entity');
const { Download } = require('../../../entities/download.entity');
const { R2Service } = require('../../../services/r2.service');
const { SignedUrlService } = require('../../../services/signed-url.service');
const { FileService } = require('../file/services/file.service');

@Injectable()
class DownloadService {
  constructor(
    @InjectRepository(File)
    private fileRepository,
    @InjectRepository(Download)
    private downloadRepository,
    private r2Service,
    private signedUrlService,
    private fileService,
  ) {}

  async getFileForAd(fileId) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, isDeleted: false },
      relations: ['user'],
    });

    if (!file) {
      throw new NotFoundException('File not found or has expired');
    }

    if (file.expiryDate && file.expiryDate < new Date() && !file.isPermanent) {
      throw new BadRequestException('File has expired');
    }

    return {
      id: file.id,
      fileName: file.fileName,
      size: file.size,
      downloadCount: file.downloadCount,
    };
  }

  async verifyAdView(fileId, ipAddress) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, isDeleted: false },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const download = this.downloadRepository.create({
      fileId: file.id,
      ipAddress,
      adShown: true,
    });
    await this.downloadRepository.save(download);

    const downloadToken = this.signedUrlService.generateDownloadToken(fileId, ipAddress);
    const downloadUrl = await this.r2Service.getSignedDownloadUrl(file.storageKey, 300);

    await this.fileService.incrementDownloadCount(fileId);

    return { downloadToken, downloadUrl };
  }

  async getDownloadUrl(token, ipAddress) {
    try {
      const payload = this.signedUrlService.verifyDownloadToken(token);
      
      if (payload.ip !== ipAddress) {
        throw new BadRequestException('Invalid IP address');
      }

      const file = await this.fileRepository.findOne({
        where: { id: payload.fileId, isDeleted: false },
      });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      return this.r2Service.getSignedDownloadUrl(file.storageKey, 300);
    } catch {
      throw new BadRequestException('Invalid or expired download token');
    }
  }
}

module.exports = { DownloadService };
