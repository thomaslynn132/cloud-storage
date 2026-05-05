import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Download } from '../../entities/download.entity';

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    @InjectRepository(Download)
    private downloadRepository: Repository<Download>,
  ) {}

  async recordImpression(fileId: string, ipAddress: string): Promise<void> {
    await this.downloadRepository.update(
      { fileId, ipAddress, adShown: true },
      { adShown: true }
    );
  }

  async recordClick(fileId: string, ipAddress: string): Promise<void> {
    await this.downloadRepository.update(
      { fileId, ipAddress },
      { adClicked: true }
    );
  }

  async getAdStats(fileId?: string) {
    const query = this.downloadRepository.createQueryBuilder('download');
    
    if (fileId) {
      query.where('download.fileId = :fileId', { fileId });
    }

    const impressions = await query.getCount();

    const clickQuery = this.downloadRepository.createQueryBuilder('download')
      .where('download.adClicked = :clicked', { clicked: true });
    
    if (fileId) {
      clickQuery.andWhere('download.fileId = :fileId', { fileId });
    }

    const clicks = await clickQuery.getCount();

    return {
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    };
  }
}
