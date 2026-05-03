import { ApiProperty } from '@nestjs/swagger';

export class SummarizeArticleResponseDto {
  @ApiProperty()
  articleId: string;

  @ApiProperty()
  summary: string;

  @ApiProperty()
  originalLength: number;

  @ApiProperty()
  summaryLength: number;
}