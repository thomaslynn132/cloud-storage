const { Injectable, Logger, OnApplicationBootstrap } = require('@nestjs/common');
const { InjectRepository } = require('@nestjs/typeorm');
const { Repository } = require('typeorm');
const { User } = require('../../../entities/user.entity');
const { appConfig } = require('../../../config/app.config');
const bcrypt = require('bcrypt');

@Injectable()
class AdminSeedService {
  constructor(
    @InjectRepository(User)
    private userRepository,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    const existingAdmin = await this.userRepository.findOne({
      where: { isAdmin: true },
    });

    if (existingAdmin) {
      this.logger.log('Admin account already exists');
      return;
    }

    const passwordHash = await bcrypt.hash(appConfig.adminPassword, 10);
    const admin = this.userRepository.create({
      email: appConfig.adminEmail,
      passwordHash,
      planType: 'paid',
      isAdmin: true,
    });

    await this.userRepository.save(admin);
    this.logger.log(`Admin account created: ${appConfig.adminEmail}`);
    this.logger.log(`Password: ${appConfig.adminPassword}`);
  }
}

module.exports = { AdminSeedService };
