import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class ContentDistributionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ContentDistributionMiddleware.name);
  
  private cdnDomains: string[] = [
    process.env.CDN_DOMAIN || 'cdn.filehost.com',
  ];

  constructor(
    private prisma: PrismaService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const fileId = req.params.id;
    if (!fileId) {
      return next();
    }

    // Add CDN headers for content distribution
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');

    next();
  }

  generateCDNUrl(storageKey: string): string {
    const cdnDomain = this.cdnDomains[0];
    return `https://${cdnDomain}/${storageKey}`;
  }

  async trackContentView(fileId: string, ipAddress: string): Promise<void> {
    // Track for analytics and abuse detection
    this.logger.log(`Content view: ${fileId} from ${ipAddress}`);
  }
}
