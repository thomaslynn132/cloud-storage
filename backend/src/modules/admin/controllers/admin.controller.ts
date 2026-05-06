import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { FileService } from '../../file/services/file.service';
import { AdsService } from '../../ads/services/ads.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private fileService: FileService,
    private adsService: AdsService,
  ) {}

  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiResponse({ status: 200, description: 'Returns stats' })
  @Get('stats')
  async getStats() {
    const files = await this.fileService.getUserFiles('all');
    const adStats = await this.adsService.getAdStats();

    return {
      totalFiles: files.length,
      totalStorage: files.reduce((acc, f) => acc + f.size, 0),
      adStats,
    };
  }
}
