import { IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Test comment' })
  @IsString()
  content: string;

  @ApiProperty()
  @IsUUID()
  articleId: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  authorId?: string | null;
}