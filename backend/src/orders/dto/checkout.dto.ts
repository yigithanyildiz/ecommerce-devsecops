import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export type CheckoutPaymentMethod = 'DEMO_CARD' | 'CASH_ON_DELIVERY';

export class CheckoutDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  recipientName?: string;

  @IsString()
  @MinLength(5)
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  shippingCity?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  shippingAddressLine?: string;

  @IsUUID()
  @IsOptional()
  addressId?: string;

  @IsIn(['DEMO_CARD', 'CASH_ON_DELIVERY'])
  @IsOptional()
  paymentMethod?: CheckoutPaymentMethod;
}
