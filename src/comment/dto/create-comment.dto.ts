import { IsOptional, IsString, ValidateIf } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateCommentDto {
  @ApiProperty({ example: 'Test comment' })
  @IsString()
  content: string

  @ApiProperty({ example: 'art1' })
  @IsString()
  articleId: string

  @ApiPropertyOptional({ nullable: true, example: 'user2' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  authorId?: string | null
}