import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { R2Service } from '../../../services/r2.service';
import { HashService } from '../../../services/hash.service';
import { appConfig } from '../../../config/app.config';
import { PrismaService } from '../../../services/prisma.service';
import { User, PlanType } from '@prisma/client';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private prisma: PrismaService,
    private r2Service: R2Service,
    private hashService: HashService,
  ) {}

  async createFile(userId: string, fileName: string, size: number, hash: string, storageKey: string, isPermanent: boolean = false, duration: number = 0): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check storage limit using BigInt
    const storageLimit = BigInt(user.storageLimit);
    const storageUsed = BigInt(user.storageUsed);
    const fileSize = BigInt(size);

    if (storageUsed + fileSize > storageLimit) {
      throw new Error('Storage limit exceeded');
    }

    // Calculate expiry date based on user's paid retention or free default
    let expiryDate: Date | null = null;
    if (!isPermanent) {
      const retentionDays = user.planType === PlanType.FREE 
        ? appConfig.freeFileExpiryDays 
        : 365; // Default 1 year for paid, can be overridden by payment
      expiryDate = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
    }

    const file = await this.prisma.file.create({
      data: {
        userId,
        fileName,
        size,
        duration,
        hash,
        storageKey,
        isPermanent,
        expiryDate,
      },
    });

    // Update user storage used (keep as BigInt in database)
    await this.prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: BigInt(size) } },
    });

    return file;
  }

  async getFile(fileId: string, userId?: string): Promise<any> {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, isDeleted: false },
      include: { user: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return {
      id: file.id,
      fileName: file.fileName,
      size: file.size,
      mimeType: file.mimeType,
      downloadCount: file.downloadCount,
      isPermanent: file.isPermanent,
      expiryDate: file.expiryDate,
      createdAt: file.createdAt,
    };
  }

  async browseFiles(): Promise<any[]> {
    return this.prisma.file.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        size: true,
        downloadCount: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    });
  }

  async getUserFiles(userId: string): Promise<any[]> {
    // If userId is 'all', return all files (admin only)
    const where: any = { isDeleted: false };
    if (userId !== 'all') {
      where.userId = userId;
    }
    
    return this.prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, userType: true } } },
    });
  }

  async renameFile(fileId: string, userId: string, newName: string): Promise<any> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return this.prisma.file.update({
      where: { id: fileId },
      data: { fileName: newName },
    });
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: true },
    });

    // Update user storage used (decrement as BigInt)
    await this.prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { decrement: BigInt(file.size) } },
    });

    // Delete from R2
    try {
      await this.r2Service.deleteFile(file.storageKey);
    } catch (error) {
      this.logger.error(`Failed to delete file from R2: ${error.message}`);
    }
  }

  async findFileByHash(hash: string): Promise<any | null> {
    return this.prisma.file.findFirst({
      where: { hash, isDeleted: false },
    });
  }

  async incrementDownloadCount(fileId: string): Promise<void> {
    await this.prisma.file.update({
      where: { id: fileId },
      data: { downloadCount: { increment: 1 } },
    });
  }

  async getExpiredFiles(): Promise<any[]> {
    return this.prisma.file.findMany({
      where: {
        isDeleted: false,
        expiryDate: { lt: new Date() },
        isPermanent: false,
      },
    });
  }

  async cleanupFile(file: any): Promise<void> {
    await this.prisma.file.update({
      where: { id: file.id },
      data: { isDeleted: true },
    });

    // Update user storage used
    await this.prisma.user.update({
      where: { id: file.userId },
      data: { storageUsed: { decrement: BigInt(file.size) } },
    });

    // Delete from R2
    try {
      await this.r2Service.deleteFile(file.storageKey);
    } catch (error) {
      this.logger.error(`Failed to delete file from R2: ${error.message}`);
    }
  }
}
