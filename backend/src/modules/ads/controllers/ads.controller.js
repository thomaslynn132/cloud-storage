const { Controller, Get, Post, Param, Body, Query } = require('@nestjs/common');
const { ApiTags, ApiOperation, ApiResponse } = require('@nestjs/swagger');
const { AdsService } = require('./services/ads.service');

@ApiTags('ads')
@Controller('ads')
class AdsController {
  constructor(private adsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get ad statistics' })
  @ApiResponse({ status: 200, description: 'Returns ad stats' })
  async getStats(@Query('fileId') fileId) {
    return this.adsService.getAdStats(fileId);
  }
}

module.exports = { AdsController };
