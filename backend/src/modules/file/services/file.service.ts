import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { R2Service } from '../../../services/r2.service';
import { HashService } from '../../../services/hash.service';
import { appConfig } from '../../../config/app.config';
import { PrismaService } from '../../../services/prisma.service';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private prisma: PrismaService,
    private r2Service: R2Service,
    private hashService: HashService,
  ) {}

  async createFile(userId: string, fileName: string, size: number, hash: string, storageKey: string, isPermanent: boolean = false): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const storageLimit = this.getStorageLimit(user.planType);
    if (user.storageUsed + size > storageLimit) {
      throw new Error('Storage limit exceeded');
    }

    const expiryDate = isPermanent ? null : new Date(Date.now() + appConfig.freeFileExpiryDays * 24 * 60 * 60 * 1000);

    const file = await this.prisma.file.create({
      data: {
        userId,
        fileName,
        size,
        hash,
        storageKey,
        isPermanent,
        expiryDate,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { storageUsed: { increment: size } },
    });

    return file;
  }

  async getFile(fileId: string, userId?: string): Promise<any> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId, isDeleted: false },
      include: { user: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async getUserFiles(userId: string): Promise<any[]> {
    return this.prisma.file.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
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

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { storageUsed: Math.max(0, user.storageUsed - file.size) },
      });
    }

    await this.r2Service.deleteFile(file.storageKey);
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

    const user = await this.prisma.user.findUnique({ where: { id: file.userId } });
    if (user) {
      await this.prisma.user.update({
        where: { id: file.userId },
        data: { storageUsed: Math.max(0, user.storageUsed - file.size) },
      });
    }

    await this.r2Service.deleteFile(file.storageKey);
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
