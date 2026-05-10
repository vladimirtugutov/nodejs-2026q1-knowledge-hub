import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { RagIndexerService } from './rag-indexer.service';
import { RagRetrieverService } from './rag-retriever.service';
import { RagConversationService } from './rag-conversation.service';
import { VectorDbService } from './vector-db.service';
import { ChunkingService } from './chunking/chunking.service';

@Module({
  controllers: [RagController],
  providers: [
    RagService,
    RagIndexerService,
    RagRetrieverService,
    RagConversationService,
    VectorDbService,
    ChunkingService,
  ],
  exports: [RagService],
})
export class RagModule {}
