import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'TEST_CATEGORY' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Test category description' })
  @IsString()
  description: string;
}