const { Module } = require('@nestjs/common');
const { JwtModule } = require('@nestjs/jwt');
const { PassPortModule } = require('@nestjs/passport');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { User } = require('../../../entities/user.entity');
const { AuthService } = require('./services/auth.service');
const { AuthController } = require('./controllers/auth.controller');
const { JwtStrategy } = require('./strategies/jwt.strategy');
const { jwtConfig } = require('../../../config/jwt.config');

@Module({
  imports: [
    PassPortModule,
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: { expiresIn: jwtConfig.accessTokenExpiry },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
class AuthModule {}

module.exports = { AuthModule };
