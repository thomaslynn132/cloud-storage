import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../../entities/file.entity';
import { Download } from '../../entities/download.entity';
import { DownloadService } from './services/download.service';
import { DownloadController } from './controllers/download.controller';
import { R2Service } from '../../services/r2.service';
import { SignedUrlService } from '../../services/signed-url.service';
import { FileService } from '../file/services/file.service';
import { FileModule } from '../file/file.module';

@Module({
  imports: [TypeOrmModule.forFeature([File, Download]), FileModule],
  controllers: [DownloadController],
  providers: [DownloadService, R2Service, SignedUrlService, FileService],
  exports: [DownloadService],
})
export class DownloadModule {}
