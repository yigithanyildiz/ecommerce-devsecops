import { IsBoolean, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAddressDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  title?: string;

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
  city?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  addressLine?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
