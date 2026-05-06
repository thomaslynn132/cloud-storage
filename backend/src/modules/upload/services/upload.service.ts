import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { R2Service } from '../../../services/r2.service';
import { HashService } from '../../../services/hash.service';
import { FileService } from '../../file/services/file.service';
import { InitUploadDto, CompleteUploadDto } from '../dto/upload.dto';
import { appConfig } from '../../../config/app.config';
import { PrismaService } from '../../../services/prisma.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private uploadSessions: Map<string, { chunks: number; storageKey: string; userId: string }> = new Map();

  constructor(
    private prisma: PrismaService,
    private r2Service: R2Service,
    private hashService: HashService,
    private fileService: FileService,
  ) {}

  async initUpload(userId: string, dto: InitUploadDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
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

  async completeUpload(userId: string, dto: CompleteUploadDto) {
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

  private getStorageLimit(planType: string): number {
    switch (planType) {
      case 'paid':
        return appConfig.proStorageLimit;
      default:
        return appConfig.freeStorageLimit;
    }
  }
}
