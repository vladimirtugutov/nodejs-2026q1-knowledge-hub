import { Module } from '@nestjs/common';
import { ArticleModule } from '../article/article.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini/gemini.service';
import { AiCacheService } from './cache/ai-cache.service';
import { AiRateLimitService } from './rate-limit/ai-rate-limit.service';
import { AiUsageService } from './usage/ai-usage.service';

@Module({
  imports: [ArticleModule],
  controllers: [AiController],
  providers: [
    AiService,
    GeminiService,
    AiCacheService,
    AiRateLimitService,
    AiUsageService,
  ],
})
export class AiModule {}