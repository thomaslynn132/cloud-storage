import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Download } from '../../entities/download.entity';
import { AdsService } from './services/ads.service';
import { AdsController } from './controllers/ads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Download])],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
