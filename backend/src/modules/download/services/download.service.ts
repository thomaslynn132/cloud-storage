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

  async verifyAdView(fileId: string, ipAddress: string, userAgent?: string, userId?: string): Promise<{ downloadToken: string; downloadUrl: string }> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, isDeleted: false },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.expiryDate && file.expiryDate < new Date() && !file.isPermanent) {
      throw new BadRequestException('File has expired');
    }

    // Record the ad view
    await this.prisma.download.create({
      data: {
        fileId: file.id,
        userId,
        ipAddress,
        userAgent,
        adShown: true,
      },
    });

    // Generate download token
    const downloadToken = this.signedUrlService.generateDownloadToken(fileId, ipAddress);

    // Generate signed download URL
    const downloadUrl = await this.r2Service.getSignedDownloadUrl(file.storageKey, 300);

    // Increment download count
    await this.fileService.incrementDownloadCount(fileId);

    return { downloadToken, downloadUrl };
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

      if (file.expiryDate && file.expiryDate < new Date() && !file.isPermanent) {
        throw new BadRequestException('File has expired');
      }

      return this.r2Service.getSignedDownloadUrl(file.storageKey, 300);
    } catch (error) {
      throw new BadRequestException('Invalid or expired download token');
    }
  }

  async recordDownload(token: string, ipAddress: string): Promise<void> {
    try {
      const payload = this.signedUrlService.verifyDownloadToken(token);
      
      await this.prisma.download.updateMany({
        where: { fileId: payload.fileId, ipAddress },
        data: { downloaded: true },
      });
    } catch {
      // Ignore errors for recording
    }
  }
}
