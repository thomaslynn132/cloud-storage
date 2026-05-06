import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { appConfig } from '../../../config/app.config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../services/prisma.service';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const existingAdmin = await this.prisma.user.findFirst({
      where: { isAdmin: true },
    });

    if (existingAdmin) {
      this.logger.log('Admin account already exists');
      return;
    }

    const passwordHash = await bcrypt.hash(appConfig.adminPassword, 10);
    const admin = await this.prisma.user.create({
      data: {
        email: appConfig.adminEmail,
        passwordHash,
        planType: 'paid',
        isAdmin: true,
      },
    });

    this.logger.log(`Admin account created: ${appConfig.adminEmail}`);
    this.logger.log(`Password: ${appConfig.adminPassword}`);
  }
}
