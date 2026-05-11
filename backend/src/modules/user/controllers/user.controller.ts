import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permissions } from '../../../common/constants/permissions';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { UserService } from '../services/user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(PermissionGuard)
  @RequirePermissions(Permissions.PROFILE_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @Get('profile')
  async getProfile(@Request() req) {
    return this.userService.getUserProfile(req.user.userId);
  }

  @UseGuards(PermissionGuard)
  @RequirePermissions(Permissions.STORAGE_VIEW)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get storage info' })
  @ApiResponse({ status: 200, description: 'Returns storage information' })
  @Get('storage')
  async getStorageInfo(@Request() req) {
    return this.userService.getStorageInfo(req.user.userId);
  }

  @UseGuards(PermissionGuard)
  @RequirePermissions(Permissions.FILES_DOWNLOAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get download history' })
  @ApiResponse({ status: 200, description: 'Returns download history' })
  @Get('downloads')
  async getDownloadHistory(@Request() req) {
    return this.userService.getDownloadHistory(req.user.userId);
  }
}