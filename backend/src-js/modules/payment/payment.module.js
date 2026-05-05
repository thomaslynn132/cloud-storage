import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { PaymentService } from './services/payment.service';
import { PaymentController } from './controllers/payment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Payment])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
