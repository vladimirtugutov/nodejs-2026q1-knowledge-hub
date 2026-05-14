import { Module } from '@nestjs/common';
import { ArticleModule } from '../article/article.module';
import { AiController } from './ai.controller';
import { AiAdminController } from './ai-admin.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini/gemini.service';
import { AiCacheService } from './cache/ai-cache.service';
import { AiRateLimitService } from './rate-limit/ai-rate-limit.service';
import { AiUsageService } from './usage/ai-usage.service';
import { AiContextService } from './context/ai-context.service';

@Module({
  imports: [ArticleModule],
  controllers: [AiController, AiAdminController],
  providers: [
    AiService,
    GeminiService,
    AiCacheService,
    AiRateLimitService,
    AiUsageService,
    AiContextService,
  ],
  exports: [
    AiService,
    GeminiService,
    AiCacheService,
    AiRateLimitService,
    AiUsageService,
    AiContextService,
  ],
})
export class AiModule {}
