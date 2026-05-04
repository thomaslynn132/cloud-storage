import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FileService } from '../file/services/file.service';
import { File } from '../../entities/file.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private fileService: FileService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredFiles() {
    this.logger.log('Starting expired files cleanup...');
    
    try {
      const expiredFiles = await this.fileService.getExpiredFiles();
      this.logger.log(`Found ${expiredFiles.length} expired files`);

      for (const file of expiredFiles) {
        try {
          await this.fileService.cleanupFile(file);
          this.logger.log(`Cleaned up file: ${file.id} - ${file.fileName}`);
        } catch (error) {
          this.logger.error(`Failed to cleanup file ${file.id}:`, error);
        }
      }

      this.logger.log('Expired files cleanup completed');
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkExpiredSubscriptions() {
    this.logger.log('Checking expired subscriptions...');
    
    const users = await this.userRepository.find({
      where: { planType: 'paid' },
    });

    for (const user of users) {
      if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
        user.planType = 'free';
        user.subscriptionExpiresAt = null;
        await this.userRepository.save(user);
        this.logger.log(`Downgraded user ${user.id} to free plan`);
      }
    }
  }
}
