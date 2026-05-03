@Module({
  imports: [PrismaModule],  // для ArticleService
  controllers: [AiController],
  providers: [
    AiService,
    GeminiService,
    AiCacheService,
    AiRateLimitService,
    AppLoggerService,  // для observability
  ],
  exports: [AiService],  // если понадобится в других модулях
})
export class AiModule {}