import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ArticleStatus } from '../../common/enums/article-status.enum';

export class RagSearchRequestDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;

  @IsOptional()
  @IsEnum(ArticleStatus)
  articleStatus?: ArticleStatus;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
