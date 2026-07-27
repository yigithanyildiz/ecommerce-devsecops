import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAdminProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  price: string;

  @IsInt()
  @Min(0)
  stock: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsUUID()
  categoryId: string;
}
