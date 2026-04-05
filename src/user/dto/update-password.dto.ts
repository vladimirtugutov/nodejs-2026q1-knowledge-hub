import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'oldPassword' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'newPassword' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}