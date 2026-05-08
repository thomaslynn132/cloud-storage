import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { jwtConfig } from '../../../config/jwt.config';
import { PrismaService } from '../../../services/prisma.service';
import { UserType, PlanType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const userType = dto.userType || UserType.UPLOADER;
    
    // Set defaults based on user type
    const storageLimit = userType === UserType.UPLOADER ? 25 * 1024 * 1024 * 1024 : 0; // 25GB for uploaders
    
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        userType,
        planType: PlanType.FREE,
        storageLimit,
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtConfig.secret,
      });
      const user = await this.prisma.user.findUnique({
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

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, planType: user.planType, userType: user.userType };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m', secret: jwtConfig.secret }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d', secret: jwtConfig.secret }),
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        planType: user.planType,
      },
    };
  }
}
