import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { appConfig } from '../../config/app.config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
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
