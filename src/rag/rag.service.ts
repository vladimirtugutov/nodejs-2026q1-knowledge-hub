import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini/gemini.service';
import { RagChatRequestDto } from './dto/rag-chat-request.dto';
import { RagChatResponseDto } from './dto/rag-chat-response.dto';
import { RagConversationService } from './rag-conversation.service';
import { RagRetrieverService } from './rag-retriever.service';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly ragConversationService: RagConversationService,
    private readonly ragRetrieverService: RagRetrieverService,
  ) {}

  async chat(dto: RagChatRequestDto): Promise<RagChatResponseDto> {
    const question = dto.question?.trim();

    if (!question) {
      throw new BadRequestException('Question is required');
    }

    const conversationId =
      this.ragConversationService.getOrCreateConversationId(dto.conversationId);

    this.ragConversationService.appendMessage(conversationId, {
      role: 'user',
      content: question,
    });

    const retrieval = await this.ragRetrieverService.search({
      query: question,
      limit: 5,
    });

    const sources = retrieval.results.map((result) => ({
      articleId: result.articleId,
      articleTitle: result.articleTitle,
      relevantChunk: result.chunk,
    }));

    const history = this.ragConversationService.getHistory(conversationId);

    const prompt = this.buildGroundedPrompt({
      question,
      history,
      sources,
    });

    const answer = await this.geminiService.generateText(prompt);

    this.ragConversationService.appendMessage(conversationId, {
      role: 'assistant',
      content: answer,
    });

    this.logger.log(
      `RAG chat complete: conversationId=${conversationId}, sources=${sources.length}`,
    );

    return {
      answer,
      sources,
      conversationId,
    };
  }

  getConversationHistory(conversationId: string) {
    return this.ragConversationService.getHistory(conversationId);
  }

  private buildGroundedPrompt(params: {
    question: string;
    history: Array<{ role: string; content: string }>;
    sources: Array<{
      articleId: string;
      articleTitle: string;
      relevantChunk: string;
    }>;
  }): string {
    const historyText = params.history
      .slice(-10)
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join('\n');

    const sourcesText = params.sources
      .map(
        (source, index) =>
          `[Source ${index + 1}]
Article ID: ${source.articleId}
Title: ${source.articleTitle}
Chunk:
${source.relevantChunk}`,
      )
      .join('\n\n');

    return `
You are an assistant for the Knowledge Hub API.

Answer the user's question using ONLY the provided source chunks.
If the answer is not grounded in the sources, say that the knowledge base does not contain enough information.
Keep the answer concise and factual.

Conversation history:
${historyText || 'No previous conversation history.'}

Retrieved sources:
${sourcesText || 'No relevant sources found.'}

User question:
${params.question}
    `.trim();
  }
}
