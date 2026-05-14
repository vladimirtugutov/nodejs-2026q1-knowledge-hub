import { Injectable } from '@nestjs/common';
import { ArticleStatus as PrismaArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryArticleDto } from './dto/query-article.dto';
import { Article } from './entities/article.entity';

export type CreateArticleData = {
  title: string;
  content: string;
  status?: string;
  authorId?: string | null;
  categoryId?: string | null;
  tags?: string[];
};

export type UpdateArticleData = {
  title?: string;
  content?: string;
  status?: string;
  authorId?: string | null;
  categoryId?: string | null;
  tags?: string[];
};

@Injectable()
export class ArticleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapStatus(status?: string): PrismaArticleStatus | undefined {
    if (status === undefined) return undefined;

    switch (status) {
      case 'draft':
        return PrismaArticleStatus.DRAFT;
      case 'published':
        return PrismaArticleStatus.PUBLISHED;
      case 'archived':
        return PrismaArticleStatus.ARCHIVED;
      default:
        return undefined;
    }
  }

  async findAll(query?: QueryArticleDto): Promise<Article[]> {
    const where: Prisma.ArticleWhereInput = {
      ...(query?.status ? { status: this.mapStatus(query.status) } : {}),
      ...(query?.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query?.tag ? { tags: { some: { name: query.tag } } } : {}),
    };

    return this.prisma.article.findMany({
      where,
      include: {
        author: true,
        category: true,
        tags: true,
        comments: true,
      },
    }) as Promise<Article[]>;
  }

  async findOne(id: string): Promise<Article | null> {
    return this.prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        category: true,
        tags: true,
        comments: true,
      },
    }) as Promise<Article | null>;
  }

  async create(data: CreateArticleData): Promise<Article> {
    return this.prisma.article.create({
      data: {
        title: data.title,
        content: data.content,
        status: this.mapStatus(data.status) ?? PrismaArticleStatus.DRAFT,
        authorId: data.authorId ?? null,
        categoryId: data.categoryId ?? null,
        ...(data.tags && data.tags.length > 0
          ? {
              tags: {
                connectOrCreate: data.tags.map((name) => ({
                  where: { name },
                  create: { name },
                })),
              },
            }
          : {}),
      },
      include: {
        author: true,
        category: true,
        tags: true,
        comments: true,
      },
    }) as Promise<Article>;
  }

  async update(id: string, data: UpdateArticleData): Promise<Article> {
    return this.prisma.article.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.status !== undefined
          ? { status: this.mapStatus(data.status) }
          : {}),
        ...(data.authorId !== undefined ? { authorId: data.authorId } : {}),
        ...(data.categoryId !== undefined
          ? { categoryId: data.categoryId }
          : {}),
        ...(data.tags !== undefined
          ? {
              tags: {
                set: [],
                ...(data.tags.length > 0
                  ? {
                      connectOrCreate: data.tags.map((name) => ({
                        where: { name },
                        create: { name },
                      })),
                    }
                  : {}),
              },
            }
          : {}),
      },
      include: {
        author: true,
        category: true,
        tags: true,
        comments: true,
      },
    }) as Promise<Article>;
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.article.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { id: true },
    });

    return Boolean(article);
  }
}
