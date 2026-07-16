import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  price: string;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  @MinLength(2)
  categoryName: string;

  @IsString()
  @MinLength(2)
  categorySlug: string;
}
