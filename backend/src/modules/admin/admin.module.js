const { Module, OnModuleInit } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { User } = require('../../../entities/user.entity');
const { File } = require('../../../entities/file.entity');
const { CleanupService } = require('./services/cleanup.service');
const { AdminSeedService } = require('./services/admin-seed.service');
const { AdminController } = require('./controllers/admin.controller');
const { FileService } = require('../file/services/file.service');
const { AdsService } = require('../ads/services/ads.service');
const { FileModule } = require('../file/file.module');
const { AdsModule } = require('../ads/ads.module');
const { ScheduleModule } = require('@nestjs/schedule');

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
class AdminModule {
  constructor(private adminSeedService) {}

  async onModuleInit() {
    await this.adminSeedService.seedAdmin();
  }
}

module.exports = { AdminModule };
