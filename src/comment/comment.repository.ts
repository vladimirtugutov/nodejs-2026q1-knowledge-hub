import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentRepository {
  private comments: Comment[] = [];

  async findAll(): Promise<Comment[]> {
    return [...this.comments];
  }

  async findOne(id: string): Promise<Comment | null> {
    return this.comments.find((comment) => comment.id === id) ?? null;
  }

  async create(data: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    const comment: Comment = {
      id: randomUUID(),
      content: data.content,
      articleId: data.articleId,
      authorId: data.authorId ?? null,
      createdAt: Date.now(),
    };

    this.comments.push(comment);
    return comment;
  }

  async remove(id: string): Promise<boolean> {
    const index = this.comments.findIndex((comment) => comment.id === id);

    if (index === -1) {
      return false;
    }

    this.comments.splice(index, 1);
    return true;
  }

  async removeMany(ids: string[]): Promise<void> {
    this.comments = this.comments.filter((comment) => !ids.includes(comment.id));
  }
}