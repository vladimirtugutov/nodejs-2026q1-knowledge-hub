import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateDto {
  @ApiProperty({
    example: 'Write 3 tag ideas for a NestJS article about Prisma.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  prompt: string;

  @ApiPropertyOptional({ example: 'session-user-1' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sessionId?: string;
}
