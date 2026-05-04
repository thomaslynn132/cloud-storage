import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { CreateSubscriptionDto, UpdatePaymentStatusDto } from './dto/payment.dto';
import { appConfig } from '../../config/app.config';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async requestSubscription(userId: string, dto: CreateSubscriptionDto): Promise<Payment> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payment = this.paymentRepository.create({
      userId,
      amount: dto.amount,
      plan: dto.plan,
      stripeSubscriptionId: dto.transactionRef, // Using this field for transaction reference
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'pending',
    });

    await this.paymentRepository.save(payment);
    this.logger.log(`Payment request created: ${payment.id} for user ${userId}`);

    return payment;
  }

  async updatePaymentStatus(dto: UpdatePaymentStatusDto): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: dto.paymentId },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = dto.status as any;
    await this.paymentRepository.save(payment);

    if (dto.status === 'approved') {
      const user = payment.user;
      user.planType = 'paid';
      user.subscriptionExpiresAt = payment.expiresAt;
      await this.userRepository.save(user);
      this.logger.log(`User ${user.id} upgraded to paid plan`);
    }

    return payment;
  }

  async getPendingPayments(): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { status: 'pending' },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
