import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FileService } from '../services/file.service';

@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(private fileService: FileService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user files' })
  @ApiResponse({ status: 200, description: 'Returns list of files' })
  @Get()
  async getUserFiles(@Request() req) {
    return this.fileService.getUserFiles(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Browse all available files (for downloaders)' })
  @ApiResponse({ status: 200, description: 'Returns list of available files' })
  @Get('browse')
  async browseFiles() {
    return this.fileService.browseFiles();
  }

  @ApiOperation({ summary: 'Get public file info' })
  @ApiResponse({ status: 200, description: 'Returns file info' })
  @Get(':id')
  async getFileInfo(@Param('id') id: string) {
    return this.fileService.getFile(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a file' })
  @ApiResponse({ status: 200, description: 'File updated' })
  @Patch(':id/rename')
  async renameFile(@Param('id') id: string, @Body('fileName') fileName: string, @Request() req) {
    return this.fileService.renameFile(id, req.user.userId, fileName);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted' })
  @Delete(':id')
  async deleteFile(@Param('id') id: string, @Request() req) {
    await this.fileService.deleteFile(id, req.user.userId);
    return { message: 'File deleted successfully' };
  }
}
