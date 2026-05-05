const { Controller, Post, Body, UseGuards, Req } = require('@nestjs/common');
const { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } = require('@nestjs/swagger');
const { JwtAuthGuard } = require('../../auth/guards/jwt-auth.guard');
const { UploadService } = require('./services/upload.service');
const { InitUploadDto, CompleteUploadDto } = require('./dto/upload.dto');

@ApiTags('upload')
@Controller('upload')
class UploadController {
  constructor(private uploadService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize file upload' })
  @ApiResponse({ status: 201, description: 'Upload initialized' })
  @Post('init')
  async initUpload(req, @Body() dto) {
    return this.uploadService.initUpload(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete file upload' })
  @ApiResponse({ status: 200, description: 'Upload completed' })
  @Post('complete')
  async completeUpload(req, @Body() dto) {
    return this.uploadService.completeUpload(req.user.userId, dto);
  }
}

module.exports = { UploadController };
