const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { ConfigModule } = require('@nestjs/config');
const { BullModule } = require('@nestjs/bull');
const { ThrottlerModule } = require('@nestjs/throttler');
const { ScheduleModule } = require('@nestjs/schedule');

// Entities
const { User } = require('./entities/user.entity');
const { File } = require('./entities/file.entity');
const { Download } = require('./entities/download.entity');
const { Payment } = require('./entities/payment.entity');

// Modules
const { AuthModule } = require('./modules/auth/auth.module');
const { UserModule } = require('./modules/user/user.module');
const { FileModule } = require('./modules/file/file.module');
const { UploadModule } = require('./modules/upload/upload.module');
const { DownloadModule } = require('./modules/download/download.module');
const { PaymentModule } = require('./modules/payment/payment.module');
const { AdsModule } = require('./modules/ads/ads.module');
const { AdminModule } = require('./modules/admin/admin.module');

// Config
const { typeOrmConfig } = require('./config/typeorm.config');
const { redisConfig } = require('./config/redis.config');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    BullModule.forRoot({
      connection: redisConfig,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 100,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    FileModule,
    UploadModule,
    DownloadModule,
    PaymentModule,
    AdsModule,
    AdminModule,
  ],
})
export class AppModule {}
