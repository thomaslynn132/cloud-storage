import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma.service';
import { PlanType } from '@prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, planType: true, storageUsed: true, createdAt: true, subscriptionExpiresAt: true, userType: true },
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

    const storageLimit = user.planType === PlanType.PAID 
      ? BigInt(500 * 1024 * 1024 * 1024) 
      : BigInt(user.storageLimit);
    
    const used = BigInt(user.storageUsed);
    const percentage = storageLimit > 0n ? Number((used * 100n) / storageLimit) : 0;
    
    return {
      used: user.storageUsed,
      limit: storageLimit.toString(),
      percentage,
      planType: user.planType,
    };
  }
}
