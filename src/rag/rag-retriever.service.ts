import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini/gemini.service';
import { RagIndexerService } from './rag-indexer.service';
import { RagSearchRequestDto } from './dto/rag-search-request.dto';
import {
  RagSearchResponseDto,
  RagSearchResultDto,
} from './dto/rag-search-response.dto';
import { ArticleStatus } from '../common/enums/article-status.enum';

interface SearchablePoint {
  id: string;
  vector: number[];
  payload: {
    articleId: string;
    title: string;
    text: string;
    status: ArticleStatus;
    categoryId: string | null;
    tags: string[];
    chunkIndex: number;
    updatedAt: string;
  };
}

@Injectable()
export class RagRetrieverService {
  private readonly logger = new Logger(RagRetrieverService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly ragIndexerService: RagIndexerService,
  ) {}

  async search(dto: RagSearchRequestDto): Promise<RagSearchResponseDto> {
    const query = dto.query?.trim();

    if (!query) {
      throw new BadRequestException('Query is required');
    }

    const queryEmbedding = await this.geminiService.embedText(query);
    const limit = Math.min(Math.max(dto.limit ?? 5, 1), 20);

    const points = this.ragIndexerService.getAllPoints() as SearchablePoint[];

    const results: RagSearchResultDto[] = points
      .filter((point) => this.matchesFilters(point.payload, dto))
      .map((point) => ({
        articleId: point.payload.articleId,
        articleTitle: point.payload.title,
        chunk: point.payload.text,
        similarity: Number(
          this.cosineSimilarity(queryEmbedding, point.vector).toFixed(6),
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    this.logger.log(
      `Search complete: query="${query}", results=${results.length}`,
    );

    return { results };
  }

  private matchesFilters(
    payload: SearchablePoint['payload'],
    dto: RagSearchRequestDto,
  ): boolean {
    if (dto.articleStatus && payload.status !== dto.articleStatus) {
      return false;
    }

    if (dto.categoryId && payload.categoryId !== dto.categoryId) {
      return false;
    }

    if (dto.tags?.length) {
      const hasAnyTag = dto.tags.some((tag) => payload.tags.includes(tag));
      if (!hasAnyTag) {
        return false;
      }
    }

    return true;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) {
      return 0;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i += 1) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dot / denominator;
  }
}
