import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { RagService } from './rag.service';
import { RagIndexerService } from './rag-indexer.service';
import { RagRetrieverService } from './rag-retriever.service';
import { ReindexRequestDto } from './dto/reindex-request.dto';
import { ReindexResponseDto } from './dto/reindex-response.dto';
import { RagSearchRequestDto } from './dto/rag-search-request.dto';
import { RagSearchResponseDto } from './dto/rag-search-response.dto';
import { RagChatRequestDto } from './dto/rag-chat-request.dto';
import { RagChatResponseDto } from './dto/rag-chat-response.dto';

@Controller('ai/rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly ragIndexerService: RagIndexerService,
    private readonly ragRetrieverService: RagRetrieverService,
  ) {}

  @Post('index')
  @HttpCode(200)
  reindex(@Body() dto: ReindexRequestDto): Promise<ReindexResponseDto> {
    return this.ragIndexerService.reindex(dto);
  }

  @Post('search')
  @HttpCode(200)
  search(@Body() dto: RagSearchRequestDto): Promise<RagSearchResponseDto> {
    return this.ragRetrieverService.search(dto);
  }

  @Post('chat')
  @HttpCode(200)
  chat(@Body() dto: RagChatRequestDto): Promise<RagChatResponseDto> {
    return this.ragService.chat(dto);
  }

  @Delete('index/articles/:articleId')
  @HttpCode(204)
  async deleteArticle(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
  ): Promise<void> {
    const deleted = await this.ragIndexerService.deleteArticle(articleId);

    if (deleted === 0) {
      throw new NotFoundException(
        `Indexed chunks for article ${articleId} were not found`,
      );
    }
  }

  @Get('chat/:conversationId/history')
  @HttpCode(200)
  getHistory(@Param('conversationId') conversationId: string) {
    return this.ragService.getConversationHistory(conversationId);
  }

  @Get('index/stats')
  @HttpCode(200)
  async getStats() {
    return this.ragIndexerService.getCollectionStats();
  }
}
