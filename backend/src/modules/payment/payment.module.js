const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { User } = require('../../../entities/user.entity');
const { Payment } = require('../../../entities/payment.entity');
const { PaymentService } = require('./services/payment.service');
const { PaymentController } = require('./controllers/payment.controller');

@Module({
  imports: [TypeOrmModule.forFeature([User, Payment])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
class PaymentModule {}

module.exports = { PaymentModule };
