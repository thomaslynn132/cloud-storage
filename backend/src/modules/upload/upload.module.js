const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { File } = require('../../../entities/file.entity');
const { User } = require('../../../entities/user.entity');
const { UploadService } = require('./services/upload.service');
const { UploadController } = require('./controllers/upload.controller');
const { R2Service } = require('../../../services/r2.service');
const { HashService } = require('../../../services/hash.service');
const { FileService } = require('../file/services/file.service');
const { FileModule } = require('../file/file.module');

@Module({
  imports: [TypeOrmModule.forFeature([File, User]), FileModule],
  controllers: [UploadController],
  providers: [UploadService, R2Service, HashService, FileService],
  exports: [UploadService],
})
class UploadModule {}

module.exports = { UploadModule };
