const { Injectable } = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const { jwtConfig } = require('../config/jwt.config');

@Injectable()
class SignedUrlService {
  constructor(jwtService) {
    this.jwtService = jwtService;
  }

  generateDownloadToken(fileId, ipAddress) {
    return this.jwtService.sign(
      { fileId, ip: ipAddress, type: 'download' },
      { expiresIn: '10m', secret: jwtConfig.secret }
    );
  }

  verifyDownloadToken(token) {
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

  generateAdToken(fileId, ipAddress) {
    return this.jwtService.sign(
      { fileId, ip: ipAddress, type: 'ad', verified: true },
      { expiresIn: '5m', secret: jwtConfig.secret }
    );
  }

  verifyAdToken(token) {
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

module.exports = { SignedUrlService };
