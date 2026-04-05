import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @ValidateIf(o => o.name !== undefined)
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @ValidateIf(o => o.description !== undefined)
  @IsString()
  description?: string;
}