import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class RagConversationService {
  private readonly conversations = new Map<string, ConversationMessage[]>();
  private readonly maxMessages = Number(
    process.env.RAG_CONVERSATION_MAX_MESSAGES ?? 20,
  );

  getOrCreateConversationId(conversationId?: string): string {
    const id = conversationId ?? randomUUID();

    if (!this.conversations.has(id)) {
      this.conversations.set(id, []);
    }

    return id;
  }

  appendMessage(conversationId: string, message: ConversationMessage): void {
    const history = this.conversations.get(conversationId) ?? [];

    history.push(message);

    const trimmedHistory =
      history.length > this.maxMessages
        ? history.slice(-this.maxMessages)
        : history;

    this.conversations.set(conversationId, trimmedHistory);
  }

  getHistory(conversationId: string): ConversationMessage[] {
    return this.conversations.get(conversationId) ?? [];
  }

  clear(conversationId: string): void {
    this.conversations.delete(conversationId);
  }
}
