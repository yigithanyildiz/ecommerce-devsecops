import { IsString, MinLength } from 'class-validator';

export class CreateAdminCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string;
}
