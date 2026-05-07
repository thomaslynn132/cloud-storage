import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { R2Service } from '../../../services/r2.service';
import { HashService } from '../../../services/hash.service';
import { FileService } from '../../file/services/file.service';
import { InitUploadDto, CompleteUploadDto } from '../dto/upload.dto';
import { appConfig } from '../../../config/app.config';
import { PrismaService } from '../../../services/prisma.service';
import { PlanType } from '@prisma/client';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private uploadSessions: Map<string, { chunks: number; storageKey: string; userId: string; fileSize: number }> = new Map();

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

    // Check if user is uploader
    if (user.userType !== 'UPLOADER') {
      throw new ForbiddenException('Only uploaders can upload files');
    }

    // Check storage limit
    const storageLimit = BigInt(user.storageLimit);
    const storageUsed = BigInt(user.storageUsed);
    const fileSize = BigInt(dto.fileSize);

    if (storageUsed + fileSize > storageLimit) {
      throw new Error('Storage limit exceeded');
    }

    // Check duration limit for free users
    if (user.planType === PlanType.FREE && user.durationLimit > 0) {
      const fileDuration = dto.duration || 0;
      if (fileDuration > user.durationLimit) {
        throw new Error(`File duration exceeds limit for free plan`);
      }
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
        dto.duration,
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
      fileSize: dto.fileSize,
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

    const fileName = dto.storageKey.split('/').pop();
    const file = await this.fileService.createFile(
      userId,
      fileName,
      session.fileSize,
      '',
      dto.storageKey,
      false,
      0, // duration will be updated after processing
    );

    this.uploadSessions.delete(dto.uploadId);

    return { fileId: file.id, message: 'Upload completed successfully' };
  }
}
