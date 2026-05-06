import { Module } from '@nestjs/common';
import { AdsService } from './services/ads.service';
import { AdsController } from './controllers/ads.controller';
import { PrismaService } from '../../services/prisma.service';

@Module({
  imports: [],
  controllers: [AdsController],
  providers: [AdsService, PrismaService],
  exports: [AdsService],
})
export class AdsModule {}
