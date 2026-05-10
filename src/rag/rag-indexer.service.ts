import { Injectable } from '@nestjs/common';
import { ReindexRequestDto } from './dto/reindex-request.dto';
import { ReindexResponseDto } from './dto/reindex-response.dto';
import { ChunkingService } from './chunking/chunking.service';
import { VectorDbService } from './vector-db.service';

@Injectable()
export class RagIndexerService {
  constructor(
    private readonly chunkingService: ChunkingService,
    private readonly vectorDbService: VectorDbService,
  ) {}

  async reindex(_dto: ReindexRequestDto): Promise<ReindexResponseDto> {
    await this.vectorDbService.ensureCollection();

    return {
      indexedArticles: 0,
      indexedChunks: 0,
      vectorCollection: process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles',
    };
  }

  async deleteArticle(articleId: string): Promise<number> {
    return this.vectorDbService.deleteByArticleId(articleId);
  }
}
