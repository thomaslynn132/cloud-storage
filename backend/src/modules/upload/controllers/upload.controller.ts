import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UploadService } from '../services/upload.service';
import { InitUploadDto, CompleteUploadDto } from '../dto/upload.dto';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize file upload' })
  @ApiResponse({ status: 201, description: 'Upload initialized' })
  @Post('init')
  async initUpload(@Request() req, @Body() dto: InitUploadDto) {
    return this.uploadService.initUpload(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete file upload' })
  @ApiResponse({ status: 200, description: 'Upload completed' })
  @Post('complete')
  async completeUpload(@Request() req, @Body() dto: CompleteUploadDto) {
    return this.uploadService.completeUpload(req.user.userId, dto);
  }
}
