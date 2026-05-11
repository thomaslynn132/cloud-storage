import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { FileModule } from './modules/file/file.module';
import { UploadModule } from './modules/upload/upload.module';
import { DownloadModule } from './modules/download/download.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AdsModule } from './modules/ads/ads.module';
import { AdminModule } from './modules/admin/admin.module';
import { BullModule } from '@nestjs/bullmq';
import { redisConfig } from './config/redis.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaService } from './services/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: redisConfig,
      }),
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: 60,
            limit: 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    AuthModule,
    UserModule,
    FileModule,
    UploadModule,
    DownloadModule,
    PaymentModule,
    AdsModule,
    AdminModule,
  ],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
