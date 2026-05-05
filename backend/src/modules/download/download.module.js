const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { File } = require('../../../entities/file.entity');
const { Download } = require('../../../entities/download.entity');
const { DownloadService } = require('./services/download.service');
const { DownloadController } = require('./controllers/download.controller');
const { R2Service } = require('../../../services/r2.service');
const { SignedUrlService } = require('../../../services/signed-url.service');
const { FileService } = require('../file/services/file.service');
const { FileModule } = require('../file/file.module');

@Module({
  imports: [TypeOrmModule.forFeature([File, Download]), FileModule],
  controllers: [DownloadController],
  providers: [DownloadService, R2Service, SignedUrlService, FileService],
  exports: [DownloadService],
})
class DownloadModule {}

module.exports = { DownloadModule };
