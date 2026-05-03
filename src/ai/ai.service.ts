import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { ArticleService } from '../article/article.service';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { ForbiddenError } from '../common/errors/forbidden.error';
import { AiCacheService } from './cache/ai-cache.service';
import {
  AnalyzeArticleDto,
  AnalyzeTask,
} from './dto/analyze-article.dto';
import { AnalyzeArticleResponseDto } from './dto/analyze-article-response.dto';
import {
  SummarizeArticleDto,
  SummaryLength,
} from './dto/summarize-article.dto';
import { SummarizeArticleResponseDto } from './dto/summarize-article-response.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { TranslateArticleResponseDto } from './dto/translate-article-response.dto';
import { GeminiService } from './gemini/gemini.service';
import {
  analyzeResponseSchema,
  summarizeResponseSchema,
  translateResponseSchema,
} from './gemini/schemas';
import { buildAnalyzePrompt } from './prompts/analyze.prompt';
import { buildSummarizePrompt } from './prompts/summarize.prompt';
import { buildTranslatePrompt } from './prompts/translate.prompt';
import { AiRateLimitService } from './rate-limit/ai-rate-limit.service';
import { AiUsageService } from './usage/ai-usage.service';

@Injectable()
export class AiService {
  private readonly cacheTtlSec: number;

  constructor(
    private readonly articleService: ArticleService,
    private readonly geminiService: GeminiService,
    private readonly aiCacheService: AiCacheService,
    private readonly aiRateLimitService: AiRateLimitService,
    private readonly aiUsageService: AiUsageService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtlSec = Number(
      this.configService.get<string>('AI_CACHE_TTL_SEC', '300'),
    );
  }

  async summarize(
    articleId: string,
    dto: SummarizeArticleDto,
    user: JwtPayload,
  ): Promise<SummarizeArticleResponseDto> {
    const article = await this.assertArticleAccess(articleId, user);
    this.checkRateLimit(`summarize:${user.userId}`);

    const maxLength = dto.maxLength ?? SummaryLength.MEDIUM;
    const cacheKey = `summarize:${article.id}:${article.updatedAt.toISOString()}:${maxLength}`;
    const cached =
      this.aiCacheService.get<SummarizeArticleResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const prompt = buildSummarizePrompt({
      title: article.title,
      content: article.content,
      maxLength,
    });

    const result = await this.geminiService.generateJson<{ summary: string }>(
      prompt,
      summarizeResponseSchema,
    );

    const response: SummarizeArticleResponseDto = {
      articleId: article.id,
      summary: result.summary,
      originalLength: article.content.length,
      summaryLength: result.summary.length,
    };

    this.aiCacheService.set(cacheKey, response, this.cacheTtlSec);
    this.aiUsageService.track('summarize');
    return response;
  }

  async translate(
    articleId: string,
    dto: TranslateArticleDto,
    user: JwtPayload,
  ): Promise<TranslateArticleResponseDto> {
    const article = await this.assertArticleAccess(articleId, user);
    this.checkRateLimit(`translate:${user.userId}`);

    const cacheKey = `translate:${article.id}:${article.updatedAt.toISOString()}:${dto.targetLanguage}:${dto.sourceLanguage ?? 'auto'}`;
    const cached =
      this.aiCacheService.get<TranslateArticleResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const prompt = buildTranslatePrompt({
      title: article.title,
      content: article.content,
      targetLanguage: dto.targetLanguage,
      sourceLanguage: dto.sourceLanguage,
    });

    const result = await this.geminiService.generateJson<{
      translatedText: string;
      detectedLanguage: string;
    }>(prompt, translateResponseSchema);

    const response: TranslateArticleResponseDto = {
      articleId: article.id,
      translatedText: result.translatedText,
      detectedLanguage: result.detectedLanguage,
    };

    this.aiCacheService.set(cacheKey, response, this.cacheTtlSec);
    this.aiUsageService.track('translate');
    return response;
  }

  async analyze(
    articleId: string,
    dto: AnalyzeArticleDto,
    user: JwtPayload,
  ): Promise<AnalyzeArticleResponseDto> {
    const article = await this.assertArticleAccess(articleId, user);
    this.checkRateLimit(`analyze:${user.userId}`);

    const task = dto.task ?? AnalyzeTask.REVIEW;
    const prompt = buildAnalyzePrompt({
      title: article.title,
      content: article.content,
      task,
    });

    const parsed = await this.geminiService.generateJson<{
      analysis: string;
      suggestions: string[];
      severity: 'info' | 'warning' | 'error';
    }>(prompt, analyzeResponseSchema);

    const response: AnalyzeArticleResponseDto = {
      articleId: article.id,
      analysis: parsed.analysis,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      severity: parsed.severity ?? 'info',
    };

    this.aiUsageService.track('analyze');
    return response;
  }

  private async assertArticleAccess(articleId: string, user: JwtPayload) {
    const article = await this.articleService.findOne(articleId);

    if (user.role !== UserRole.admin && article.authorId !== user.userId) {
      throw new ForbiddenError('You can access AI operations only for your own articles');
    }

    return article;
  }

  private checkRateLimit(key: string): void {
    const retryAfter = this.aiRateLimitService.check(key);

    if (retryAfter !== null) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'AI rate limit exceeded',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}