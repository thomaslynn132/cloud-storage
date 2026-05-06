import { Module, OnModuleInit } from '@nestjs/common';
import { CleanupService } from './services/cleanup.service';
import { AdminSeedService } from './services/admin-seed.service';
import { AdminController } from './controllers/admin.controller';
import { FileModule } from '../file/file.module';
import { AdsModule } from '../ads/ads.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../../services/prisma.service';

@Module({
  imports: [
    FileModule,
    AdsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AdminController],
  providers: [CleanupService, AdminSeedService, PrismaService],
  exports: [CleanupService, AdminSeedService],
})
export class AdminModule implements OnModuleInit {
  constructor(private adminSeedService: AdminSeedService) {}

  async onModuleInit() {
    await (this.adminSeedService as any).seedAdmin();
  }
}
