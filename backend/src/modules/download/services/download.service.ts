import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { File } from '../../entities/file.entity';
import { Download } from '../../entities/download.entity';
import { R2Service } from '../../services/r2.service';
import { SignedUrlService } from '../../services/signed-url.service';
import { FileService } from '../file/services/file.service';
import { appConfig } from '../../config/app.config';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(Download)
    private downloadRepository: Repository<Download>,
    private r2Service: R2Service,
    private signedUrlService: SignedUrlService,
    private fileService: FileService,
  ) {}

  async getFileForAd(fileId: string) {
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

  async verifyAdView(fileId: string, ipAddress: string): Promise<{ adToken: string; downloadUrl: string }> {
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

    const adToken = this.signedUrlService.generateAdToken(fileId, ipAddress);
    const downloadToken = this.signedUrlService.generateDownloadToken(fileId, ipAddress);

    const downloadUrl = await this.r2Service.getSignedDownloadUrl(file.storageKey, 300);

    await this.fileService.incrementDownloadCount(fileId);

    return { adToken, downloadUrl };
  }

  async getDownloadUrl(token: string, ipAddress: string): Promise<string> {
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
