import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, planType: true, storageUsed: true, createdAt: true, subscriptionExpiresAt: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getStorageInfo(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const storageLimit = user.planType === 'paid' ? 500 * 1024 * 1024 * 1024 : 5 * 1024 * 1024 * 1024;
    
    return {
      used: user.storageUsed,
      limit: storageLimit,
      percentage: (user.storageUsed / storageLimit) * 100,
    };
  }
}
