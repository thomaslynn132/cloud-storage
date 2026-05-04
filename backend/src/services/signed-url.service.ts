import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';

@Injectable()
export class SignedUrlService {
  private readonly logger = new Logger(SignedUrlService.name);

  constructor(private jwtService: JwtService) {}

  generateDownloadToken(fileId: string, ipAddress: string): string {
    return this.jwtService.sign(
      { fileId, ip: ipAddress, type: 'download' },
      { expiresIn: '10m', secret: jwtConfig.secret }
    );
  }

  verifyDownloadToken(token: string): { fileId: string; ip: string } {
    try {
      const payload = this.jwtService.verify(token, { secret: jwtConfig.secret });
      if (payload.type !== 'download') {
        throw new Error('Invalid token type');
      }
      return { fileId: payload.fileId, ip: payload.ip };
    } catch {
      throw new Error('Invalid or expired download token');
    }
  }

  generateAdToken(fileId: string, ipAddress: string): string {
    return this.jwtService.sign(
      { fileId, ip: ipAddress, type: 'ad', verified: true },
      { expiresIn: '5m', secret: jwtConfig.secret }
    );
  }

  verifyAdToken(token: string): { fileId: string; ip: string } {
    try {
      const payload = this.jwtService.verify(token, { secret: jwtConfig.secret });
      if (payload.type !== 'ad' || !payload.verified) {
        throw new Error('Invalid ad token');
      }
      return { fileId: payload.fileId, ip: payload.ip };
    } catch {
      throw new Error('Invalid or expired ad token');
    }
  }
}
