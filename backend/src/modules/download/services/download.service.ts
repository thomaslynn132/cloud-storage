import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { R2Service } from '../../../services/r2.service';
import { SignedUrlService } from '../../../services/signed-url.service';
import { FileService } from '../../file/services/file.service';
import { appConfig } from '../../../config/app.config';
import { PrismaService } from '../../../services/prisma.service';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  constructor(
    private prisma: PrismaService,
    private r2Service: R2Service,
    private signedUrlService: SignedUrlService,
    private fileService: FileService,
  ) {}

  async getFileForAd(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, isDeleted: false },
      include: { user: true },
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
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, isDeleted: false },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.prisma.download.create({
      data: {
        fileId: file.id,
        ipAddress,
        adShown: true,
      },
    });

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

      const file = await this.prisma.file.findUnique({
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
