import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryCommentDto {
  @ApiProperty()
  @IsUUID()
  articleId: string;
}