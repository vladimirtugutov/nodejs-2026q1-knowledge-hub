import { Injectable } from '@nestjs/common';
import { RagChatRequestDto } from './dto/rag-chat-request.dto';
import { RagChatResponseDto } from './dto/rag-chat-response.dto';
import { RagConversationService } from './rag-conversation.service';

@Injectable()
export class RagService {
  constructor(
    private readonly ragConversationService: RagConversationService,
  ) {}

  async chat(dto: RagChatRequestDto): Promise<RagChatResponseDto> {
    const conversationId =
      this.ragConversationService.getOrCreateConversationId(dto.conversationId);

    this.ragConversationService.appendMessage(conversationId, {
      role: 'user',
      content: dto.question,
    });

    const answer = 'RAG chat is not implemented yet.';

    this.ragConversationService.appendMessage(conversationId, {
      role: 'assistant',
      content: answer,
    });

    return {
      answer,
      sources: [],
      conversationId,
    };
  }

  async getConversationHistory(conversationId: string) {
    return this.ragConversationService.getHistory(conversationId);
  }
}
