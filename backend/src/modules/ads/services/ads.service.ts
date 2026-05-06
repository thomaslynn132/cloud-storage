import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../services/prisma.service';

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async recordImpression(fileId: string, ipAddress: string): Promise<void> {
    await this.prisma.download.updateMany({
      where: { fileId, ipAddress, adShown: true },
      data: { adShown: true },
    });
  }

  async recordClick(fileId: string, ipAddress: string): Promise<void> {
    await this.prisma.download.updateMany({
      where: { fileId, ipAddress },
      data: { adClicked: true },
    });
  }

  async getAdStats(fileId?: string) {
    const impressions = await this.prisma.download.count({
      where: fileId ? { fileId } : undefined,
    });

    const clicks = await this.prisma.download.count({
      where: {
        ...(fileId && { fileId }),
        adClicked: true,
      },
    });

    return {
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    };
  }
}
