const { Controller, Get, Post, Param, Body, Req, BadRequestException } = require('@nestjs/common');
const { ApiTags, ApiOperation, ApiResponse } = require('@nestjs/swagger');
const { DownloadService } = require('./services/download.service');

@ApiTags('download')
@Controller('files')
class DownloadController {
  constructor(private downloadService) {}

  @Get(':id/ad')
  @ApiOperation({ summary: 'Get file info for ad display' })
  @ApiResponse({ status: 200, description: 'File info returned' })
  async getAdPage(@Param('id') id) {
    return this.downloadService.getFileForAd(id);
  }

  @Post(':id/verify-ad')
  @ApiOperation({ summary: 'Verify ad view and get download token' })
  @ApiResponse({ status: 200, description: 'Ad verified, download token issued' })
  async verifyAd(@Param('id') id, @Req() req) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    return this.downloadService.verifyAdView(id, ipAddress);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download file with token' })
  @ApiResponse({ status: 200, description: 'Returns signed download URL' })
  async download(@Param('id') id, @Query('token') token, @Req() req) {
    if (!token) {
      throw new BadRequestException('Download token required');
    }
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    return this.downloadService.getDownloadUrl(token, ipAddress);
  }
}

module.exports = { DownloadController };
