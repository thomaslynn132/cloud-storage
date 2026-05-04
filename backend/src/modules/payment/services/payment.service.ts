import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import Stripe from 'stripe';
import { stripeConfig } from '../../config/stripe.config';
import { appConfig } from '../../config/app.config';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {
    this.stripe = new Stripe(stripeConfig.secretKey || 'sk_test_dummy', {
      apiVersion: '2024-11-30.acacia',
    });
  }

  async createSubscription(userId: string, plan: 'basic' | 'pro') {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const priceId = plan === 'pro' ? stripeConfig.proPriceId : stripeConfig.basicPriceId;
    
    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });

      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      const payment = this.paymentRepository.create({
        userId: user.id,
        amount: plan === 'pro' ? 9900 : 4900,
        plan,
        stripeSubscriptionId: subscription.id,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      await this.paymentRepository.save(payment);

      return {
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      };
    } catch (error) {
      this.logger.error('Stripe error:', error);
      throw new Error('Payment processing failed');
    }
  }

  async handleWebhook(signature: string, body: Buffer) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        stripeConfig.webhookSecret || 'whsec_dummy'
      );

      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object);
          break;
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook error:', error);
      throw error;
    }
  }

  private async handlePaymentSuccess(invoice: any) {
    const customerId = invoice.customer;
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = (customer as Stripe.Customer).metadata.userId;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.planType = 'paid';
      user.subscriptionExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await this.userRepository.save(user);
    }
  }

  private async handleSubscriptionCancelled(subscription: any) {
    const customerId = subscription.customer;
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = (customer as Stripe.Customer).metadata.userId;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.planType = 'free';
      user.subscriptionExpiresAt = null;
      await this.userRepository.save(user);
    }
  }
}
