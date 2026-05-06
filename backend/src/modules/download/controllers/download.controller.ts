import { Controller, Get, Post, Param, Body, Query, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DownloadService } from '../services/download.service';
import { VerifyAdDto } from '../dto/download.dto';

@ApiTags('download')
@Controller('files')
export class DownloadController {
  constructor(private downloadService: DownloadService) {}

  @Get(':id/ad')
  @ApiOperation({ summary: 'Get file info for ad display' })
  @ApiResponse({ status: 200, description: 'File info returned' })
  async getAdPage(@Param('id') id: string) {
    return this.downloadService.getFileForAd(id);
  }

  @Post(':id/verify-ad')
  @ApiOperation({ summary: 'Verify ad view and get download token' })
  @ApiResponse({ status: 200, description: 'Ad verified, download token issued' })
  async verifyAd(@Param('id') id: string, @Req() req) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    return this.downloadService.verifyAdView(id, ipAddress);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download file with token' })
  @ApiResponse({ status: 200, description: 'Returns signed download URL' })
  async download(@Param('id') id: string, @Query('token') token: string, @Req() req) {
    if (!token) {
      throw new BadRequestException('Download token required');
    }
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    return this.downloadService.getDownloadUrl(token, ipAddress);
  }
}
