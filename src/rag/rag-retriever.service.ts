import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini/gemini.service';
import { RagSearchRequestDto } from './dto/rag-search-request.dto';
import {
  RagSearchResponseDto,
  RagSearchResultDto,
} from './dto/rag-search-response.dto';
import { VectorDbService } from './vector-db.service';

@Injectable()
export class RagRetrieverService {
  private readonly logger = new Logger(RagRetrieverService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly vectorDbService: VectorDbService,
  ) {}

  async search(dto: RagSearchRequestDto): Promise<RagSearchResponseDto> {
    const query = dto.query?.trim();

    if (!query) {
      throw new BadRequestException('Query is required');
    }

    const queryEmbedding = await this.geminiService.embedText(query);
    const limit = Math.min(Math.max(dto.limit ?? 5, 1), 20);

    const filter = this.buildQdrantFilter(dto);

    const points = await this.vectorDbService.search(
      queryEmbedding,
      limit,
      filter,
    );

    const results: RagSearchResultDto[] = points.map((point) => ({
      articleId: point.payload.articleId,
      articleTitle: point.payload.title,
      chunk: point.payload.text,
      similarity: Number(point.score.toFixed(6)),
    }));

    this.logger.log(
      `Search complete: query="${query}", results=${results.length}`,
    );

    return { results };
  }

  private buildQdrantFilter(
    dto: RagSearchRequestDto,
  ): Record<string, unknown> | undefined {
    const must: Array<Record<string, unknown>> = [];

    if (dto.articleStatus) {
      must.push({
        key: 'status',
        match: {
          value: dto.articleStatus,
        },
      });
    }

    if (dto.categoryId) {
      must.push({
        key: 'categoryId',
        match: {
          value: dto.categoryId,
        },
      });
    }

    if (dto.tags?.length) {
      must.push({
        should: dto.tags.map((tag) => ({
          key: 'tags',
          match: {
            value: tag,
          },
        })),
      });
    }

    if (must.length === 0) {
      return undefined;
    }

    return { must };
  }
}
