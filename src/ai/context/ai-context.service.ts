import { Injectable } from '@nestjs/common';

type Message = {
  role: 'user' | 'assistant';
  text: string;
};

@Injectable()
export class AiContextService {
  private readonly sessions = new Map<string, Message[]>();
  private readonly maxMessages = 6;

  getContext(sessionId: string): Message[] {
    return this.sessions.get(sessionId) ?? [];
  }

  append(sessionId: string, message: Message): void {
    const current = this.sessions.get(sessionId) ?? [];
    current.push(message);

    if (current.length > this.maxMessages) {
      current.splice(0, current.length - this.maxMessages);
    }

    this.sessions.set(sessionId, current);
  }
}