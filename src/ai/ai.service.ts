import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { UserRole } from '@prisma/client';
import { ArticleService } from '../article/article.service';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { ForbiddenError } from '../common/errors/forbidden.error';
import { AiCacheService } from './cache/ai-cache.service';
import { AiContextService } from './context/ai-context.service';
import { AnalyzeArticleDto, AnalyzeTask } from './dto/analyze-article.dto';
import { AnalyzeArticleResponseDto } from './dto/analyze-article-response.dto';
import { GenerateDto } from './dto/generate.dto';
import { GenerateResponseDto } from './dto/generate-response.dto';
import {
  SummarizeArticleDto,
  SummaryLength,
} from './dto/summarize-article.dto';
import { SummarizeArticleResponseDto } from './dto/summarize-article-response.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { TranslateArticleResponseDto } from './dto/translate-article-response.dto';
import { UsageResponseDto } from './dto/usage-response.dto';
import { GeminiService } from './gemini/gemini.service';
import {
  analyzeResponseSchema,
  generateResponseSchema,
  summarizeResponseSchema,
  translateResponseSchema,
} from './gemini/schemas';
import { buildAnalyzePrompt } from './prompts/analyze.prompt';
import { buildGeneratePrompt } from './prompts/generate.prompt';
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
    private readonly aiContextService: AiContextService,
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
    const startedAt = Date.now();
    const article = await this.assertArticleAccess(articleId, user);
    this.checkRateLimit(`summarize:${user.userId}`);

    const maxLength = dto.maxLength ?? SummaryLength.MEDIUM;
    const cacheKey = `summarize:${article.id}:${article.updatedAt.toISOString()}:${maxLength}`;
    const cached =
      this.aiCacheService.get<SummarizeArticleResponseDto>(cacheKey);

    if (cached) {
      this.aiUsageService.trackCacheHit();
      this.aiUsageService.track('summarize', Date.now() - startedAt);
      return cached;
    }

    this.aiUsageService.trackCacheMiss();

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
    this.aiUsageService.track('summarize', Date.now() - startedAt);
    return response;
  }

  async translate(
    articleId: string,
    dto: TranslateArticleDto,
    user: JwtPayload,
  ): Promise<TranslateArticleResponseDto> {
    const startedAt = Date.now();
    const article = await this.assertArticleAccess(articleId, user);
    this.checkRateLimit(`translate:${user.userId}`);

    const cacheKey = `translate:${article.id}:${article.updatedAt.toISOString()}:${dto.targetLanguage}:${dto.sourceLanguage ?? 'auto'}`;
    const cached =
      this.aiCacheService.get<TranslateArticleResponseDto>(cacheKey);

    if (cached) {
      this.aiUsageService.trackCacheHit();
      this.aiUsageService.track('translate', Date.now() - startedAt);
      return cached;
    }

    this.aiUsageService.trackCacheMiss();

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
    this.aiUsageService.track('translate', Date.now() - startedAt);
    return response;
  }

  async analyze(
    articleId: string,
    dto: AnalyzeArticleDto,
    user: JwtPayload,
  ): Promise<AnalyzeArticleResponseDto> {
    const startedAt = Date.now();
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

    this.aiUsageService.track('analyze', Date.now() - startedAt);
    return response;
  }

  async generate(
    dto: GenerateDto,
    user: JwtPayload,
  ): Promise<GenerateResponseDto> {
    const startedAt = Date.now();
    this.checkRateLimit(`generate:${user.userId}`);

    const sessionId = dto.sessionId ?? randomUUID();
    const context = this.aiContextService.getContext(sessionId);

    const prompt = buildGeneratePrompt({
      prompt: dto.prompt,
      context,
    });

    const result = await this.geminiService.generateJson<{ text: string }>(
      prompt,
      generateResponseSchema,
    );

    this.aiContextService.append(sessionId, {
      role: 'user',
      text: dto.prompt,
    });

    this.aiContextService.append(sessionId, {
      role: 'assistant',
      text: result.text,
    });

    this.aiUsageService.track('generate', Date.now() - startedAt);

    return {
      text: result.text,
      sessionId,
    };
  }

  getUsage(): UsageResponseDto {
    return this.aiUsageService.getStats();
  }

  private async assertArticleAccess(articleId: string, user: JwtPayload) {
    const article = await this.articleService.findOne(articleId);

    if (user.role !== UserRole.admin && article.authorId !== user.userId) {
      throw new ForbiddenError(
        'You can access AI operations only for your own articles',
      );
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
