import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { File } from '../../entities/file.entity';
import { User } from '../../entities/user.entity';
import { R2Service } from '../../services/r2.service';
import { HashService } from '../../services/hash.service';
import { appConfig } from '../../config/app.config';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private r2Service: R2Service,
    private hashService: HashService,
  ) {}

  async createFile(userId: string, fileName: string, size: number, hash: string, storageKey: string, isPermanent: boolean = false): Promise<File> {
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

  async getFile(fileId: string, userId?: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, isDeleted: false },
      relations: ['user'],
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async getUserFiles(userId: string): Promise<File[]> {
    return this.fileRepository.find({
      where: { userId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
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

  async findFileByHash(hash: string): Promise<File | null> {
    return this.fileRepository.findOne({
      where: { hash, isDeleted: false },
    });
  }

  async incrementDownloadCount(fileId: string): Promise<void> {
    await this.fileRepository.increment({ id: fileId }, 'downloadCount', 1);
  }

  async getExpiredFiles(): Promise<File[]> {
    return this.fileRepository.find({
      where: {
        isDeleted: false,
        expiryDate: LessThan(new Date()),
        isPermanent: false,
      },
    });
  }

  async cleanupFile(file: File): Promise<void> {
    file.isDeleted = true;
    await this.fileRepository.save(file);

    const user = await this.userRepository.findOne({ where: { id: file.userId } });
    if (user) {
      user.storageUsed = Math.max(0, user.storageUsed - file.size);
      await this.userRepository.save(user);
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
