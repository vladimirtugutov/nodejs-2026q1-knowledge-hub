import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConversationMessage } from './types/rag.types';

@Injectable()
export class RagConversationService {
  private readonly conversations = new Map<string, ConversationMessage[]>();
  private readonly maxMessages = Number(process.env.RAG_CONVERSATION_MAX_MESSAGES ?? 20);

  createConversationId(): string {
    return randomUUID();
  }

  getHistory(conversationId: string): ConversationMessage[] {
    return this.conversations.get(conversationId) ?? [];
  }

  appendMessage(
    conversationId: string,
    message: Omit<ConversationMessage, 'createdAt'>,
  ): ConversationMessage[] {
    const history = this.getHistory(conversationId);

    const nextMessage: ConversationMessage = {
      ...message,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [...history, nextMessage].slice(-this.maxMessages);
    this.conversations.set(conversationId, nextHistory);

    return nextHistory;
  }

  getOrCreateConversationId(conversationId?: string): string {
    return conversationId?.trim() ? conversationId : this.createConversationId();
  }
}
