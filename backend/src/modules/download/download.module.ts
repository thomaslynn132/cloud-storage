import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DownloadService } from './services/download.service';
import { DownloadController } from './controllers/download.controller';
import { R2Service } from '../../services/r2.service';
import { SignedUrlService } from '../../services/signed-url.service';
import { jwtConfig } from '../../config/jwt.config';
import { FileModule } from '../file/file.module';
import { PrismaService } from '../../services/prisma.service';

@Module({
  imports: [FileModule, JwtModule.register({ secret: jwtConfig.secret })],
  controllers: [DownloadController],
  providers: [DownloadService, R2Service, SignedUrlService, PrismaService],
  exports: [DownloadService],
})
export class DownloadModule {}
