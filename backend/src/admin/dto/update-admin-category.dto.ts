import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdminCategoryDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  slug?: string;
}