import { Injectable, Logger } from '@nestjs/common';
import { ArticleStatus } from '../common/enums/article-status.enum';
import { ReindexRequestDto } from './dto/reindex-request.dto';
import { ReindexResponseDto } from './dto/reindex-response.dto';
import { GeminiService } from '../ai/gemini/gemini.service';
import { ArticleService } from '../article/article.service';
import { ChunkingService } from './chunking/chunking.service';
import { QueryArticleDto } from '../article/dto/query-article.dto';
import { Article } from '../article/entities/article.entity';

interface MockVectorPoint {
  id: string;
  vector: number[];
  payload: {
    articleId: string;
    title: string;
    status: ArticleStatus;
    categoryId: string | null;
    tags: string[];
    chunkIndex: number;
    updatedAt: string;
  };
}

@Injectable()
export class RagIndexerService {
  private readonly logger = new Logger(RagIndexerService.name);
  private readonly mockStorage = new Map<string, MockVectorPoint>();
  private readonly collection =
    process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles';

  constructor(
    private readonly geminiService: GeminiService,
    private readonly articleService: ArticleService,
    private readonly chunkingService: ChunkingService,
  ) {}

  async reindex(dto: ReindexRequestDto): Promise<ReindexResponseDto> {
    this.logger.log(
      `Starting reindex: onlyPublished=${dto.onlyPublished}, articleIds=${dto.articleIds?.length ?? 0}`,
    );

    const articles = await this.getArticlesForIndexing(dto);

    let indexedArticles = 0;
    let indexedChunks = 0;

    for (const article of articles) {
      await this.deleteArticle(article.id);

      const chunks = this.chunkingService.splitArticle({
        articleId: article.id,
        title: article.title,
        content: article.content,
        status: this.mapArticleStatus(article.status),
        categoryId: article.categoryId,
        tags: article.tags.map((tag) => tag.name),
        updatedAt: article.updatedAt,
      });

      const embeddedChunks = await Promise.all(
        chunks.map(async (chunk) => ({
          ...chunk,
          embedding: await this.geminiService.embedText(chunk.text),
        })),
      );

      for (const chunk of embeddedChunks) {
        this.mockStorage.set(chunk.id, {
          id: chunk.id,
          vector: chunk.embedding,
          payload: chunk.meta,
        });
      }

      indexedArticles += 1;
      indexedChunks += chunks.length;
    }

    this.logger.log(
      `Reindex complete: indexedArticles=${indexedArticles}, indexedChunks=${indexedChunks}`,
    );

    return {
      indexedArticles,
      indexedChunks,
      vectorCollection: this.collection,
    };
  }

  async deleteArticle(articleId: string): Promise<number> {
    let deleted = 0;

    for (const [key, value] of this.mockStorage.entries()) {
      if (value.payload.articleId === articleId) {
        this.mockStorage.delete(key);
        deleted += 1;
      }
    }

    this.logger.log(
      `Deleted ${deleted} indexed chunks for article ${articleId}`,
    );
    return deleted;
  }

  getCollectionStats(): { totalChunks: number; collection: string } {
    return {
      totalChunks: this.mockStorage.size,
      collection: this.collection,
    };
  }

  private async getArticlesForIndexing(
    dto: ReindexRequestDto,
  ): Promise<Article[]> {
    const query: QueryArticleDto = {};

    if (dto.onlyPublished ?? true) {
      query.status = 'PUBLISHED' as never;
    }

    const result = await this.articleService.findAll(query);
    const articles = Array.isArray(result) ? result : result.data;

    if (dto.articleIds?.length) {
      const articleIds = new Set(dto.articleIds);
      return articles.filter((article) => articleIds.has(article.id));
    }

    return articles;
  }

  private mapArticleStatus(status: string): ArticleStatus {
    switch (status) {
      case 'DRAFT':
      case 'draft':
        return ArticleStatus.DRAFT;
      case 'PUBLISHED':
      case 'published':
        return ArticleStatus.PUBLISHED;
      case 'ARCHIVED':
      case 'archived':
        return ArticleStatus.ARCHIVED;
      default:
        throw new Error(`Unsupported article status: ${status}`);
    }
  }
}
