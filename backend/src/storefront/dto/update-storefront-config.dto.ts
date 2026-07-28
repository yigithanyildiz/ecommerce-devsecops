import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateStorefrontConfigDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  heroEyebrow?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  heroTitle?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  heroSubtitle?: string;

  @IsString()
  @IsOptional()
  heroImageUrl?: string;

  @IsString()
  @IsOptional()
  heroTargetCategorySlug?: string;
}
