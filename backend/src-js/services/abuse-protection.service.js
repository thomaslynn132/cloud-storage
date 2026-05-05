import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

export interface BlockedHash {
  hash: string;
  reason: string;
  reportedAt: Date;
}

@Injectable()
export class AbuseProtectionService {
  private readonly logger = new Logger(AbuseProtectionService.name);
  
  private blockedHashes: Set<string> = new Set();
  private blockedIPs: Map<string, number> = new Map();
  private readonly MAX_REQUESTS_PER_HOUR = 100;

  constructor(
    @InjectRepository('BlockedHash')
    private blockedHashRepository: Repository<any>,
  ) {
    this.loadBlockedHashes();
  }

  async checkHashNotBlocked(hash: string): Promise<void> {
    if (this.blockedHashes.has(hash)) {
      throw new BadRequestException('File hash is blocked due to policy violation');
    }
  }

  async blockHash(hash: string, reason: string): Promise<void> {
    this.blockedHashes.add(hash);
    this.logger.warn(`Blocked hash: ${hash} - Reason: ${reason}`);
  }

  async checkIPNotBlocked(ip: string): Promise<void> {
    const blockedUntil = this.blockedIPs.get(ip);
    if (blockedUntil && blockedUntil > Date.now()) {
      throw new BadRequestException('IP is temporarily blocked');
    }
  }

  async recordIPRequest(ip: string): Promise<void> {
    const key = `ip:${ip}`;
    const now = Date.now();
    const requests = this.blockedIPs.get(key) || 0;
    
    if (requests > this.MAX_REQUESTS_PER_HOUR) {
      this.blockedIPs.set(ip, now + 3600000); // Block for 1 hour
      throw new BadRequestException('Rate limit exceeded. IP blocked for 1 hour.');
    }
    
    this.blockedIPs.set(key, requests + 1);
    
    // Reset after 1 hour
    setTimeout(() => {
      this.blockedIPs.delete(key);
    }, 3600000);
  }

  async reportFile(fileId: string, reason: string, reporterIP: string): Promise<void> {
    this.logger.warn(`File reported: ${fileId} - Reason: ${reason} - Reporter: ${reporterIP}`);
  }

  private async loadBlockedHashes(): Promise<void> {
    // In production, load from database
    this.logger.log('Loading blocked hashes...');
  }
}
