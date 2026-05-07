import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { PaymentType, PricingType } from '@prisma/client';

export class CreatePaymentDto {
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

  @IsEnum(PricingType)
  pricingType: PricingType;

  @IsNumber()
  @Min(1)
  units: number; // GB for storage or days for retention

  @IsNumber()
  amount: number; // in cents

  @IsOptional()
  @IsNumber()
  retentionDays?: number;

  @IsOptional()
  @IsString()
  storageBytes?: string; // BigInt as string

  @IsOptional()
  @IsString()
  transactionRef?: string;

  @IsOptional()
  @IsString()
  paymentProof?: string; // file path to uploaded proof image
}

export class CreatePricingRuleDto {
  @IsString()
  name: string;

  @IsEnum(PricingType)
  type: PricingType;

  @IsNumber()
  @Min(1)
  pricePerUnit: number; // in cents

  @IsNumber()
  @Min(1)
  minUnits: number;

  @IsOptional()
  @IsNumber()
  maxUnits?: number;
}

export class UpdatePaymentStatusDto {
  @IsString()
  paymentId: string;

  @IsString()
  status: 'approved' | 'rejected' | 'pending';

  @IsOptional()
  @IsString()
  adminNote?: string;
}
