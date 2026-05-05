const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { Download } = require('../../../entities/download.entity');
const { AdsService } = require('./services/ads.service');
const { AdsController } = require('./controllers/ads.controller');

@Module({
  imports: [TypeOrmModule.forFeature([Download])],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
class AdsModule {}

module.exports = { AdsModule };
