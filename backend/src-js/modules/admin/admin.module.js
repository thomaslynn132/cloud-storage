import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { File } from '../../entities/file.entity';
import { CleanupService } from './services/cleanup.service';
import { AdminSeedService } from './services/admin-seed.service';
import { AdminController } from './controllers/admin.controller';
import { FileService } from '../file/services/file.service';
import { AdsService } from '../ads/services/ads.service';
import { FileModule } from '../file/file.module';
import { AdsModule } from '../ads/ads.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, File]),
    FileModule,
    AdsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AdminController],
  providers: [CleanupService, AdminSeedService, FileService, AdsService],
  exports: [CleanupService, AdminSeedService],
})
export class AdminModule implements OnModuleInit {
  constructor(private adminSeedService: AdminSeedService) {}

  async onModuleInit() {
    await this.adminSeedService.seedAdmin();
  }
}
