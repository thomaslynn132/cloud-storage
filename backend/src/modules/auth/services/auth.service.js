const { Injectable, UnauthorizedException } = require('@nestjs/common');
const bcrypt = require('bcrypt');
const { InjectRepository } = require('@nestjs/typeorm');
const { Repository } = require('typeorm');
const { User } = require('../../entities/user.entity');
const { jwtConfig } = require('../../config/jwt.config');

@Injectable()
class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository,
    private jwtService,
  ) {}

  async register(dto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
    });
    await this.userRepository.save(user);

    return this.generateTokens(user);
  }

  async login(dto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtConfig.secret,
      });
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  generateTokens(user) {
    const payload = { sub: user.id, email: user.email, planType: user.planType };
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: jwtConfig.accessTokenExpiry,
        secret: jwtConfig.secret,
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: jwtConfig.refreshTokenExpiry,
        secret: jwtConfig.secret,
      }),
    };
  }
}

module.exports = { AuthService };
