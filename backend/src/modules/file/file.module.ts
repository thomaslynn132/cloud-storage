import { Module } from '@nestjs/common';
import { FileService } from './services/file.service';
import { FileController } from './controllers/file.controller';
import { R2Service } from '../../services/r2.service';
import { HashService } from '../../services/hash.service';
import { PrismaService } from '../../services/prisma.service';

@Module({
  imports: [],
  controllers: [FileController],
  providers: [FileService, R2Service, HashService, PrismaService],
  exports: [FileService],
})
export class FileModule {}
