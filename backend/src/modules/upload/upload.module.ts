import { Module } from '@nestjs/common';
import { UploadService } from './services/upload.service';
import { UploadController } from './controllers/upload.controller';
import { R2Service } from '../../services/r2.service';
import { HashService } from '../../services/hash.service';
import { FileModule } from '../file/file.module';
import { PrismaService } from '../../services/prisma.service';

@Module({
  imports: [FileModule],
  controllers: [UploadController],
  providers: [UploadService, R2Service, HashService, PrismaService],
  exports: [UploadService],
})
export class UploadModule {}
