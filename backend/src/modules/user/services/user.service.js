const { Injectable } = require('@nestjs/common');
const { InjectRepository } = require('@nestjs/typeorm');
const { Repository } = require('typeorm');
const { User } = require('../../../entities/user.entity');

@Injectable()
class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository,
  ) {}

  async getUserProfile(userId) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'planType', 'storageUsed', 'createdAt', 'subscriptionExpiresAt'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getStorageInfo(userId) {
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

module.exports = { UserService };
