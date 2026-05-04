import { IsString, IsNumber } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  plan: 'basic' | 'pro';

  @IsString()
  paymentMethodId: string;
}

export class StripeWebhookDto {
  @IsString()
  event: string;
}
