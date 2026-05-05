const { Injectable } = require('@nestjs/common');
const { InjectRepository } = require('@nestjs/typeorm');
const { Repository } = require('typeorm');
const { Download } = require('../../../entities/download.entity');

@Injectable()
class AdsService {
  constructor(
    @InjectRepository(Download)
    private downloadRepository,
  ) {}

  async recordImpression(fileId, ipAddress) {
    await this.downloadRepository.update(
      { fileId, ipAddress, adShown: true },
      { adShown: true }
    );
  }

  async recordClick(fileId, ipAddress) {
    await this.downloadRepository.update(
      { fileId, ipAddress },
      { adClicked: true }
    );
  }

  async getAdStats(fileId) {
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

    const clicks = await clickQuery.getCound();

    return {
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    };
  }
}

module.exports = { AdsService };
