import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Test comment' })
  @IsString()
  content: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  articleId: string;
}
