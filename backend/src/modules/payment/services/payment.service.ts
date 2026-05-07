import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto, UpdatePaymentStatusDto } from '../dto/payment.dto';
import { PaymentType, PlanType, PricingType } from '@prisma/client';
import { PrismaService } from '../../../services/prisma.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async createPaymentRequest(userId: string, dto: CreatePaymentDto): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate expiry date based on retention days
    const expiresAt = dto.retentionDays 
      ? new Date(Date.now() + dto.retentionDays * 24 * 60 * 60 * 1000)
      : null;

    // Convert storageBytes from string to BigInt if provided
    const storageBytes = dto.storageBytes ? BigInt(dto.storageBytes) : null;

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: dto.amount,
        paymentType: dto.paymentType || PaymentType.SUBSCRIPTION,
        retentionDays: dto.retentionDays,
        storageBytes: storageBytes,
        transactionRef: dto.transactionRef,
        paymentProof: dto.paymentProof,
        expiresAt,
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

    const updateData: any = { 
      status: dto.status,
      processedAt: new Date(),
    };
    
    if (dto.adminNote) {
      updateData.adminNote = dto.adminNote;
    }

    await this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: updateData,
    });

    if (dto.status === 'approved') {
      const userUpdate: any = {
        planType: PlanType.PAID,
      };

      // Apply storage limit if purchased
      if (payment.storageBytes) {
        userUpdate.storageLimit = { increment: payment.storageBytes };
      }

      await this.prisma.user.update({
        where: { id: payment.userId },
        data: userUpdate,
      });

      this.logger.log(`User ${payment.userId} payment approved: storage=${payment.storageBytes}, retention=${payment.retentionDays} days`);
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

  async calculatePrice(pricingTypeId: string, units: number): Promise<number> {
    const pricingRule = await this.prisma.pricingRule.findUnique({
      where: { id: pricingTypeId, isActive: true },
    });

    if (!pricingRule) {
      throw new NotFoundException('Pricing rule not found');
    }

    return pricingRule.pricePerUnit * units;
  }

  async getPricingRules(type?: PricingType): Promise<any[]> {
    return this.prisma.pricingRule.findMany({
      where: {
        isActive: true,
        ...(type && { type }),
      },
      orderBy: { pricePerUnit: 'asc' },
    });
  }

  async createPricingRule(dto: any, userId: string): Promise<any> {
    const rule = await this.prisma.pricingRule.create({
      data: {
        name: dto.name,
        type: dto.type,
        pricePerUnit: dto.pricePerUnit,
        minUnits: dto.minUnits || 1,
        maxUnits: dto.maxUnits,
        createdById: userId,
      },
    });

    this.logger.log(`Pricing rule created: ${rule.id} by user ${userId}`);
    return rule;
  }
}
