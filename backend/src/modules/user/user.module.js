const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { User } = require('../../../entities/user.entity');
const { UserService } = require('./services/user.service');
const { UserController } = require('./controllers/user.controller');

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
class UserModule {}

module.exports = { UserModule };
