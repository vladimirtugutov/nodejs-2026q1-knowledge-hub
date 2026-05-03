import { ApiProperty } from '@nestjs/swagger';

export class GenerateResponseDto {
  @ApiProperty()
  text: string;

  @ApiProperty()
  sessionId: string;
}