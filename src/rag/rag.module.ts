import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ArticleModule } from '../article/article.module';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { RagIndexerService } from './rag-indexer.service';
import { RagRetrieverService } from './rag-retriever.service';
import { RagConversationService } from './rag-conversation.service';
import { VectorDbService } from './vector-db.service';
import { ChunkingService } from './chunking/chunking.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [AiModule, ArticleModule, HttpModule],
  controllers: [RagController],
  providers: [
    RagService,
    RagIndexerService,
    RagRetrieverService,
    RagConversationService,
    RagRetrieverService,
    VectorDbService,
    ChunkingService,
  ],
  exports: [RagService],
})
export class RagModule {}
