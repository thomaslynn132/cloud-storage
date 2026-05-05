const { Strategy } = require('passport-jwt');
const { Injectable } = require('@nestjs/common');
const { PassportStrategy } = require('@nestjs/passport');
const { jwtConfig } = require('../../../config/jwt.config');

@Injectable()
class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req) => {
        const authHeader = req.headers.authorization;
        return authHeader ? authHeader.replace('Bearer ', '') : null;
      },
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload) {
    return { userId: payload.sub, email: payload.email, planType: payload.planType };
  }
}

module.exports = { JwtStrategy };
