const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { File } = require('../../../entities/file.entity');
const { User } = require('../../../entities/user.entity');
const { FileService } = require('./services/file.service');
const { FileController } = require('./controllers/file.controller');
const { R2Service } = require('../../../services/r2.service');
const { HashService } = require('../../../services/hash.service');

@Module({
  imports: [TypeOrmModule.forFeature([File, User])],
  controllers: [FileController],
  providers: [FileService, R2Service, HashService],
  exports: [FileService],
})
class FileModule {}

module.exports = { FileModule };
