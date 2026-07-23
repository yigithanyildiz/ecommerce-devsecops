import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export type CheckoutPaymentMethod = 'DEMO_CARD' | 'CASH_ON_DELIVERY';

export class CheckoutDto {
  @IsString()
  @MinLength(2)
  recipientName: string;

  @IsString()
  @MinLength(5)
  phone: string;

  @IsString()
  @MinLength(2)
  shippingCity: string;

  @IsString()
  @MinLength(8)
  shippingAddressLine: string;

  @IsIn(['DEMO_CARD', 'CASH_ON_DELIVERY'])
  @IsOptional()
  paymentMethod?: CheckoutPaymentMethod;
}
