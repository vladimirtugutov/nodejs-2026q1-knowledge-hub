import { Injectable, Logger } from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';
import { GeminiService } from '../ai/gemini/gemini.service';
import { ArticleService } from '../article/article.service';
import { QueryArticleDto } from '../article/dto/query-article.dto';
import { Article } from '../article/entities/article.entity';
import { ArticleStatus } from '../common/enums/article-status.enum';
import { ChunkingService } from './chunking/chunking.service';
import { ReindexRequestDto } from './dto/reindex-request.dto';
import { ReindexResponseDto } from './dto/reindex-response.dto';
import { QdrantPoint, VectorDbService } from './vector-db.service';

const QDRANT_POINT_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

@Injectable()
export class RagIndexerService {
  private readonly logger = new Logger(RagIndexerService.name);
  private readonly collection =
    process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles';

  constructor(
    private readonly geminiService: GeminiService,
    private readonly articleService: ArticleService,
    private readonly chunkingService: ChunkingService,
    private readonly vectorDbService: VectorDbService,
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
        chunks.map(async (chunk, chunkIndex) => ({
          id: this.buildPointId(article.id, chunkIndex),
          text: chunk.text,
          meta: {
            ...chunk.meta,
            chunkIndex,
          },
          embedding: await this.geminiService.embedText(chunk.text),
        })),
      );

      const pointsToUpsert: QdrantPoint[] = embeddedChunks.map((chunk) => ({
        id: chunk.id,
        vector: chunk.embedding,
        payload: {
          ...chunk.meta,
          text: chunk.text,
        },
      }));

      await this.vectorDbService.upsertPoints(pointsToUpsert);

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
    const deleted = await this.vectorDbService.deleteByArticleId(articleId);

    this.logger.log(
      `Deleted ${deleted} indexed chunks for article ${articleId}`,
    );

    return deleted;
  }

  async getCollectionStats(): Promise<{
    totalChunks: number;
    collection: string;
  }> {
    return this.vectorDbService.getCollectionStats();
  }

  private async getArticlesForIndexing(
    dto: ReindexRequestDto,
  ): Promise<Article[]> {
    const query: QueryArticleDto = {};

    if (dto.onlyPublished ?? true) {
      query.status = this.getPublishedQueryStatus();
    }

    const result = await this.articleService.findAll(query);
    const articles = Array.isArray(result) ? result : result.data;

    if (dto.articleIds?.length) {
      const articleIds = new Set(dto.articleIds);
      return articles.filter((article) => articleIds.has(article.id));
    }

    return articles;
  }

  private getPublishedQueryStatus(): QueryArticleDto['status'] {
    return 'PUBLISHED' as QueryArticleDto['status'];
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

  private buildPointId(articleId: string, chunkIndex: number): string {
    return uuidv5(`${articleId}:${chunkIndex}`, QDRANT_POINT_NAMESPACE);
  }
}
