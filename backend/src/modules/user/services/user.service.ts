import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'planType', 'storageUsed', 'createdAt', 'subscriptionExpiresAt'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getStorageInfo(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
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
