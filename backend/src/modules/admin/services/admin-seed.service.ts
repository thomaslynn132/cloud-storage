import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { appConfig } from '../../../config/app.config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../services/prisma.service';
import { UserType, PlanType } from '@prisma/client';

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
      where: { userType: UserType.ADMIN },
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
        userType: UserType.ADMIN,
        planType: PlanType.PAID,
        storageLimit: BigInt(0), // Admins don't need storage
      },
    });

    this.logger.log(`Admin account created: ${appConfig.adminEmail}`);
    this.logger.log(`Password: ${appConfig.adminPassword}`);
  }
}
