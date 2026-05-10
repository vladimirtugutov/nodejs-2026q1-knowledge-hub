import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { RagChunk, VectorSearchResult } from './types/rag.types';

interface SearchFilters {
  articleStatus?: 'draft' | 'published' | 'archived';
  categoryId?: string;
  tags?: string[];
}

@Injectable()
export class VectorDbService {
  async ensureCollection(): Promise<void> {
    return;
  }

  async upsertChunks(
    _chunks: Array<RagChunk & { embedding: number[] }>,
  ): Promise<void> {
    return;
  }

  async search(
    _queryEmbedding: number[],
    _limit: number,
    _filters?: SearchFilters,
  ): Promise<VectorSearchResult[]> {
    return [];
  }

  async deleteByArticleId(_articleId: string): Promise<number> {
    return 0;
  }

  async healthcheck(): Promise<void> {
    return;
  }

  ensureAvailable(error: unknown): never {
    throw new ServiceUnavailableException('Vector database is unavailable');
  }
}
