export interface RagChunkMetadata {
  articleId: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  categoryId: string | null;
  tags: string[];
  chunkIndex: number;
  updatedAt: string;
}

export interface RagChunk {
  id: string;
  text: string;
  meta RagChunkMetadata;
}

export interface VectorPointPayload extends RagChunkMetadata {
  text: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  payload: VectorPointPayload;
}

export type ConversationRole = 'user' | 'assistant';

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
  createdAt: string;
}
