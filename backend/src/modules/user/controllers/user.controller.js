const { Controller, Get, UseGuards } = require('@nestjs/common');
const { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } = require('@nestjs/swagger');
const { JwtAuthGuard } = require('../../auth/guards/jwt-auth.guard');
const { UserService } = require('./services/user.service');

@ApiTags('users')
@Controller('users')
class UserController {
  constructor(private userService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @Get('profile')
  async getProfile(req) {
    return this.userService.getUserProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get storage info' })
  @ApiResponse({ status: 200, description: 'Returns storage information' })
  @Get('storage')
  async getStorageInfo(req) {
    return this.userService.getStorageInfo(req.user.userId);
  }
}

module.exports = { UserController };
