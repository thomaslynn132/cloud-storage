import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdsService } from '../services/ads.service';

@ApiTags('ads')
@Controller('ads')
export class AdsController {
  constructor(private adsService: AdsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get ad statistics' })
  @ApiResponse({ status: 200, description: 'Returns ad stats' })
  async getStats(@Query('fileId') fileId?: string) {
    return this.adsService.getAdStats(fileId);
  }
}
