import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleStatus } from '../../common/enums/article-status.enum';

export class CreateArticleDto {
  @ApiProperty({ example: 'TEST_ARTICLE' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Test article content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    enum: ArticleStatus,
    default: ArticleStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiPropertyOptional({ nullable: true, example: null })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  authorId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: null })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}