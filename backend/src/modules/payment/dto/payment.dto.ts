import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  plan: 'basic' | 'pro';

  @IsNumber()
  amount: number;

  @IsString()
  transactionRef: string;

  @IsString()
  paymentProof: string; // Base64 image or file path
}

export class UpdatePaymentStatusDto {
  @IsString()
  paymentId: string;

  @IsString()
  status: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  adminNote?: string;
}
