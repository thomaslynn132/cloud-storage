import { Controller, Get, Post, Body, UseGuards, Request, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { FileService } from '../../file/services/file.service';
import { AdsService } from '../../ads/services/ads.service';
import { PrismaService } from '../../../services/prisma.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private fileService: FileService,
    private adsService: AdsService,
    private prisma: PrismaService,
  ) {}

  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiResponse({ status: 200, description: 'Returns stats' })
  @Get('stats')
  async getStats() {
    const [files, users, payments] = await Promise.all([
      this.prisma.file.findMany({ where: { isDeleted: false } }),
      this.prisma.user.findMany(),
      this.prisma.payment.findMany({ where: { status: 'pending' } }),
    ]);

    const adStats = await this.adsService.getAdStats();

    return {
      totalFiles: files.length,
      totalStorage: files.reduce((acc, f) => acc + f.size, 0),
      totalUsers: users.length,
      uploaders: users.filter(u => u.userType === 'UPLOADER').length,
      downloaders: users.filter(u => u.userType === 'DOWNLOADER').length,
      pendingPayments: payments.length,
      adStats,
    };
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Returns all users' })
  @Get('users')
  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        userType: true,
        planType: true,
        storageUsed: true,
        storageLimit: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return this.prisma.user.update({
      where: { id },
      data: body,
    });
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    // Delete user's files from R2 first
    const files = await this.prisma.file.findMany({ where: { userId: id, isDeleted: false } });
    for (const file of files) {
      try {
        await this.fileService.deleteFile(file.id, id);
      } catch (error) {
        console.error(`Failed to delete file ${file.id}:`, error);
      }
    }

    return this.prisma.user.delete({ where: { id } });
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all files' })
  @ApiResponse({ status: 200, description: 'Returns all files' })
  @Get('files')
  async getFiles() {
    return this.prisma.file.findMany({
      where: { isDeleted: false },
      include: { user: { select: { email: true, userType: true } } },
    });
  }
}
