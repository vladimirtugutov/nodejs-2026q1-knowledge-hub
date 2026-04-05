import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Article } from './entities/article.entity';

@Injectable()
export class ArticleRepository {
  private articles: Article[] = [];

  async findAll(): Promise<Article[]> {
    return [...this.articles];
  }

  async findOne(id: string): Promise<Article | null> {
    return this.articles.find((article) => article.id === id) ?? null;
  }

  async create(
    data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Article> {
    const now = Date.now();

    const article: Article = {
      id: randomUUID(),
      title: data.title,
      content: data.content,
      status: data.status ?? 'draft',
      authorId: data.authorId ?? null,
      categoryId: data.categoryId ?? null,
      tags: data.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    this.articles.push(article);
    return article;
  }

  async update(id: string, data: Partial<Article>): Promise<Article | null> {
    const index = this.articles.findIndex((article) => article.id === id);

    if (index === -1) {
      return null;
    }

    this.articles[index] = {
      ...this.articles[index],
      ...data,
      updatedAt: Date.now(),
    };

    return this.articles[index];
  }

  async remove(id: string): Promise<boolean> {
    const index = this.articles.findIndex((article) => article.id === id);

    if (index === -1) {
      return false;
    }

    this.articles.splice(index, 1);
    return true;
  }
}