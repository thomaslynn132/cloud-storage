const { Injectable, CanActivate } = require('@nestjs/common');

@Injectable()
class JwtAuthGuard {
  canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return false;
    }
    
    try {
      const jwt = require('jsonwebtoken');
      const jwtConfig = require('../../../config/jwt.config');
      const payload = jwt.verify(token, jwtConfig.secret);
      request.user = { userId: payload.sub, email: payload.email, planType: payload.planType };
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { JwtAuthGuard };
