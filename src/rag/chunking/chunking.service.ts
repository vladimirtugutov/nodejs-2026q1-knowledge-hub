import { Injectable } from '@nestjs/common';
import { ArticleStatus } from '../../common/enums/article-status.enum';
import { ChunkingOptions } from './chunking.types';
import { RagChunk } from '../types/rag.types';

interface ChunkArticleInput {
  articleId: string;
  title: string;
  content: string;
  status: ArticleStatus;
  categoryId: string | null;
  tags: string[];
  updatedAt: Date | string;
}

@Injectable()
export class ChunkingService {
  private readonly options: ChunkingOptions = {
    chunkSize: Number(process.env.RAG_CHUNK_SIZE ?? 800),
    chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP ?? 200),
  };

  splitArticle(article: ChunkArticleInput): RagChunk[] {
    const fullText = `${article.title}\n\n${article.content}`.trim();
    const chunks: RagChunk[] = [];
    const step = Math.max(
      1,
      this.options.chunkSize - this.options.chunkOverlap,
    );

    for (
      let start = 0, index = 0;
      start < fullText.length;
      start += step, index += 1
    ) {
      const text = fullText.slice(start, start + this.options.chunkSize).trim();

      if (!text) {
        continue;
      }

      chunks.push({
        id: `${article.articleId}:${index}`,
        text,
        meta: {
          articleId: article.articleId,
          title: article.title,
          status: article.status,
          categoryId: article.categoryId,
          tags: article.tags,
          chunkIndex: index,
          updatedAt: new Date(article.updatedAt).toISOString(),
        },
      });
    }

    return chunks;
  }
}
