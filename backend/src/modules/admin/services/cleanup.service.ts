import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FileService } from '../../file/services/file.service';
import { PrismaService } from '../../../services/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private fileService: FileService,
    private prisma: PrismaService,
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
    
    const users = await this.prisma.user.findMany({
      where: { planType: 'paid' },
    });

    for (const user of users) {
      if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            planType: 'free',
            subscriptionExpiresAt: null,
          },
        });
        this.logger.log(`Downgraded user ${user.id} to free plan`);
      }
    }
  }
}
