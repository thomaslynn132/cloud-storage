import { Controller, Get, Post, Param, Body, Query, Req, BadRequestException, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DownloadService } from '../services/download.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

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
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userId = req.user?.userId;
    
    return this.downloadService.verifyAdView(id, ipAddress, userAgent, userId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download file with token' })
  @ApiResponse({ status: 200, description: 'Returns signed download URL' })
  @ApiQuery({ name: 'token', required: true, description: 'Download token from verify-ad' })
  async download(@Param('id') id: string, @Query('token') token: string, @Req() req) {
    if (!token) {
      throw new BadRequestException('Download token required');
    }
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    return this.downloadService.getDownloadUrl(token, ipAddress);
  }
}
