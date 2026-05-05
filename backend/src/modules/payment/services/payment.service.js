const { Injectable, NotFoundException } = require('@nestjs/common');
const { InjectRepository } = require('@nestjs/typeorm');
const { Repository } = require('typeorm');
const { User } = require('../../../entities/user.entity');
const { Payment } = require('../../../entities/payment.entity');

@Injectable()
class PaymentService {
  async requestSubscription(userId, dto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payment = this.paymentRepository.create({
      userId,
      amount: dto.amount,
      plan: dto.plan,
      stripeSubscriptionId: dto.transactionRef,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'pending',
    });

    await this.paymentRepository.save(payment);
    return payment;
  }

  async updatePaymentStatus(dto) {
    const payment = await this.paymentRepository.findOne({
      where: { id: dto.paymentId },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = dto.status;
    await this.paymentRepository.save(payment);

    if (dto.status === 'approved') {
      const user = payment.user;
      user.planType = 'paid';
      user.subscriptionExpiresAt = payment.expiresAt;
      await this.userRepository.save(user);
    }

    return payment;
  }

  async getPendingPayments() {
    return this.paymentRepository.find({
      where: { status: 'pending' },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserPayments(userId) {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}

module.exports = { PaymentService };
