const { Get, UseGuards } = require('@nestjs/common');
const { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } = require('@nestjs/swagger');
const { AdminGuard } = require('../../auth/guards/admin.guard');
const { FileService } = require('../file/services/file.service');
const { AdsService } = require('../ads/services/ads.service');

@ApiTags('admin')
@Controller('admin')
class AdminController {
  constructor(private fileService, private adsService) {}

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

module.exports = { AdminController };
