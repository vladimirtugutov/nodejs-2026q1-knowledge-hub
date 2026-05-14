import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface QdrantPointPayload {
  articleId: string;
  title: string;
  text: string;
  status: string;
  categoryId: string | null;
  tags: string[];
  chunkIndex: number;
  updatedAt: string;
}

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: QdrantPointPayload;
}

@Injectable()
export class VectorDbService implements OnModuleInit {
  private readonly logger = new Logger(VectorDbService.name);
  private readonly baseUrl =
    process.env.RAG_VECTOR_DB_URL ?? 'http://localhost:6333';
  private readonly collection =
    process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles';

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureCollection();
  }

  async ensureCollection(vectorSize = 768): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.put(`${this.baseUrl}/collections/${this.collection}`, {
          vectors: {
            size: vectorSize,
            distance: 'Cosine',
          },
        }),
      );

      this.logger.log(`Qdrant collection ready: ${this.collection}`);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 409) {
        this.logger.log(`Qdrant collection already exists: ${this.collection}`);
        return;
      }

      this.logger.error(
        {
          message: 'Qdrant ensureCollection failed',
          statusCode: status,
          body: error?.response?.data,
        },
        error?.stack,
      );

      throw new ServiceUnavailableException('Vector DB is unavailable');
    }
  }

  async upsertPoints(points: QdrantPoint[]): Promise<void> {
    if (points.length === 0) {
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/collections/${this.collection}/points`,
          {
            points,
          },
        ),
      );

      this.logger.log(`Upserted ${points.length} points into Qdrant`);
    } catch (error: any) {
      this.logger.error(
        {
          message: 'Qdrant upsert failed',
          statusCode: error?.response?.status,
          body: error?.response?.data,
        },
        error?.stack,
      );

      throw new ServiceUnavailableException('Vector DB is unavailable');
    }
  }

  async search(
    vector: number[],
    limit: number,
    filter?: Record<string, any>,
  ): Promise<Array<{ payload: QdrantPointPayload; score: number }>> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/collections/${this.collection}/points/search`,
          {
            vector,
            limit,
            with_payload: true,
            with_vector: false,
            ...(filter ? { filter } : {}),
          },
        ),
      );

      return response.data.result.map((item: any) => ({
        payload: item.payload,
        score: item.score,
      }));
    } catch (error: any) {
      this.logger.error(
        {
          message: 'Qdrant search failed',
          statusCode: error?.response?.status,
          body: error?.response?.data,
        },
        error?.stack,
      );

      throw new ServiceUnavailableException('Vector DB is unavailable');
    }
  }

  async deleteByArticleId(articleId: string): Promise<number> {
    try {
      const points = await this.scrollByArticleId(articleId);
      const pointIds = points.map((point) => point.id);

      if (pointIds.length === 0) {
        return 0;
      }

      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/collections/${this.collection}/points/delete`,
          {
            points: pointIds,
          },
        ),
      );

      return pointIds.length;
    } catch (error: any) {
      this.logger.error(
        {
          message: 'Qdrant deleteByArticleId failed',
          statusCode: error?.response?.status,
          body: error?.response?.data,
        },
        error?.stack,
      );

      throw new ServiceUnavailableException('Vector DB is unavailable');
    }
  }

  async getCollectionStats(): Promise<{
    totalChunks: number;
    collection: string;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/collections/${this.collection}`),
      );

      return {
        totalChunks:
          response.data?.result?.points_count ??
          response.data?.result?.vectors_count ??
          0,
        collection: this.collection,
      };
    } catch (error: any) {
      this.logger.error(
        {
          message: 'Qdrant getCollectionStats failed',
          statusCode: error?.response?.status,
          body: error?.response?.data,
        },
        error?.stack,
      );

      throw new ServiceUnavailableException('Vector DB is unavailable');
    }
  }

  private async scrollByArticleId(articleId: string): Promise<any[]> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/collections/${this.collection}/points/scroll`,
        {
          with_payload: true,
          with_vector: false,
          limit: 1000,
          filter: {
            must: [
              {
                key: 'articleId',
                match: {
                  value: articleId,
                },
              },
            ],
          },
        },
      ),
    );

    return response.data?.result?.points ?? [];
  }
}
