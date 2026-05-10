import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { AiService } from './ai.service';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { AnalyzeArticleResponseDto } from './dto/analyze-article-response.dto';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { SummarizeArticleResponseDto } from './dto/summarize-article-response.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { TranslateArticleResponseDto } from './dto/translate-article-response.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai/articles')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post(':articleId/summarize')
  @Roles(UserRole.editor, UserRole.admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate article summary' })
  @ApiOkResponse({ type: SummarizeArticleResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID or request body' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Article not found' })
  @ApiTooManyRequestsResponse({ description: 'AI rate limit exceeded' })
  async summarize(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() dto: SummarizeArticleDto,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SummarizeArticleResponseDto> {
    try {
      return await this.aiService.summarize(articleId, dto, user);
    } catch (error: unknown) {
      const response = error as {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      if (response?.getStatus?.() === 429) {
        const body = response.getResponse() as { retryAfter?: number };
        if (body?.retryAfter) {
          res.setHeader('Retry-After', String(body.retryAfter));
        }
      }
      throw error;
    }
  }

  @Post(':articleId/translate')
  @Roles(UserRole.editor, UserRole.admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Translate article content' })
  @ApiOkResponse({ type: TranslateArticleResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID or request body' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Article not found' })
  @ApiTooManyRequestsResponse({ description: 'AI rate limit exceeded' })
  async translate(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() dto: TranslateArticleDto,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TranslateArticleResponseDto> {
    try {
      return await this.aiService.translate(articleId, dto, user);
    } catch (error: unknown) {
      const response = error as {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      if (response?.getStatus?.() === 429) {
        const body = response.getResponse() as { retryAfter?: number };
        if (body?.retryAfter) {
          res.setHeader('Retry-After', String(body.retryAfter));
        }
      }
      throw error;
    }
  }

  @Post(':articleId/analyze')
  @Roles(UserRole.editor, UserRole.admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze article content' })
  @ApiOkResponse({ type: AnalyzeArticleResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID or request body' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Article not found' })
  @ApiTooManyRequestsResponse({ description: 'AI rate limit exceeded' })
  async analyze(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() dto: AnalyzeArticleDto,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AnalyzeArticleResponseDto> {
    try {
      return await this.aiService.analyze(articleId, dto, user);
    } catch (error: unknown) {
      const response = error as {
        getStatus?: () => number;
        getResponse?: () => unknown;
      };
      if (response?.getStatus?.() === 429) {
        const body = response.getResponse() as { retryAfter?: number };
        if (body?.retryAfter) {
          res.setHeader('Retry-After', String(body.retryAfter));
        }
      }
      throw error;
    }
  }
}
