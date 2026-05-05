import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../../entities/file.entity';
import { User } from '../../entities/user.entity';
import { UploadService } from './services/upload.service';
import { UploadController } from './controllers/upload.controller';
import { R2Service } from '../../services/r2.service';
import { HashService } from '../../services/hash.service';
import { FileService } from '../file/services/file.service';
import { FileModule } from '../file/file.module';

@Module({
  imports: [TypeOrmModule.forFeature([File, User]), FileModule],
  controllers: [UploadController],
  providers: [UploadService, R2Service, HashService, FileService],
  exports: [UploadService],
})
export class UploadModule {}
