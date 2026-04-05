import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'oldPassword' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'newPassword' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
