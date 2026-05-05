const { Controller, Get, Post, Delete, Param, UseGuards } = require('@nestjs/common');
const { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } = require('@nestjs/swagger');
const { JwtAuthGuard } = require('../../auth/guards/jwt-auth.guard');
const { FileService } = require('./services/file.service');

@ApiTags('files')
@Controller('files')
class FileController {
  constructor(private fileService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user files' })
  @ApiResponse({ status: 200, description: 'Returns list of files' })
  @Get()
  async getUserFiles(req) {
    return this.fileService.getUserFiles(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted' })
  @Delete(':id')
  async deleteFile(@Param('id') id, req) {
    await this.fileService.deleteFile(id, req.user.userId);
    return { message: 'File deleted successfully' };
  }
}

module.exports = { FileController };
