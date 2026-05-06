import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateSubscriptionDto, UpdatePaymentStatusDto } from '../dto/payment.dto';
import { appConfig } from '../../../config/app.config';
import { PrismaService } from '../../../services/prisma.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async requestSubscription(userId: string, dto: CreateSubscriptionDto): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: dto.amount,
        plan: dto.plan,
        stripeSubscriptionId: dto.transactionRef, // Using this field for transaction reference
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'pending',
      },
    });

    this.logger.log(`Payment request created: ${payment.id} for user ${userId}`);

    return payment;
  }

  async updatePaymentStatus(dto: UpdatePaymentStatusDto): Promise<any> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { user: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: { status: dto.status },
    });

    if (dto.status === 'approved') {
      await this.prisma.user.update({
        where: { id: payment.userId },
        data: {
          planType: 'paid',
          subscriptionExpiresAt: payment.expiresAt,
        },
      });
      this.logger.log(`User ${payment.userId} upgraded to paid plan`);
    }

    return payment;
  }

  async getPendingPayments(): Promise<any[]> {
    return this.prisma.payment.findMany({
      where: { status: 'pending' },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserPayments(userId: string): Promise<any[]> {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
