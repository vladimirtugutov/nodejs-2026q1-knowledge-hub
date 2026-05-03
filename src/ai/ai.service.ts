@Injectable()
export class AiService {
  constructor(
    private articleService: ArticleService,
    private gemini: GeminiService,
    private cache: AiCacheService,
    private rateLimit: AiRateLimitService,
    private logger: AppLoggerService,
  ) {}

  async summarize(articleId: string, dto: SummarizeArticleDto) {
    await this.rateLimit.check('summarize');

    const cacheKey = `summarize:${articleId}:${dto.maxLength}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const article = await this.articleService.findOne(articleId);  // из БД!
    if (!article) throw new NotFoundError();

    const prompt = this.loadPrompt('summarize', { article, maxLength: dto.maxLength });
    const result = await this.gemini.generate(prompt);

    const response = {
      articleId,
      summary: result.summary,
      originalLength: article.content.length,
      summaryLength: result.summary.length,
    };

    await this.cache.set(cacheKey, response, 300);
    return response;
  }
}