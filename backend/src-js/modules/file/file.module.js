import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../../entities/file.entity';
import { User } from '../../entities/user.entity';
import { FileService } from './services/file.service';
import { FileController } from './controllers/file.controller';
import { R2Service } from '../../services/r2.service';
import { HashService } from '../../services/hash.service';

@Module({
  imports: [TypeOrmModule.forFeature([File, User])],
  controllers: [FileController],
  providers: [FileService, R2Service, HashService],
  exports: [FileService],
})
export class FileModule {}
