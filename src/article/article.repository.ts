import { Injectable } from '@nestjs/common'
import { Prisma, ArticleStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateArticleDto } from './dto/create-article.dto'
import { Article } from './entities/article.entity'

@Injectable()
export class ArticleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Article[]> {
    return this.prisma.article.findMany({
      include: {
        author: true,
        category: true,
        tags: true,
        comments: true,
      },
    })
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
    })
  }

  async create(data: CreateArticleDto): Promise<Article> {
    return this.prisma.article.create({
      data: {
        title: data.title,
        content: data.content,
        status: (data.status as ArticleStatus) ?? ArticleStatus.DRAFT,
        authorId: data.authorId ?? null,
        categoryId: data.categoryId ?? null,
        tags: {
          connectOrCreate: (data.tags ?? []).map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: {
        author: true,
        category: true,
        tags: true,
        comments: true,
      },
    })
  }

  async update(id: string, data: Partial<CreateArticleDto>): Promise<Article> {
    return this.prisma.article.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.status !== undefined
          ? { status: data.status as ArticleStatus }
          : {}),
        ...(data.authorId !== undefined ? { authorId: data.authorId } : {}),
        ...(data.categoryId !== undefined
          ? { categoryId: data.categoryId }
          : {}),
        ...(data.tags !== undefined
          ? {
              tags: {
                set: [],
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
    })
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.article.delete({
        where: { id },
      })
      return true
    } catch {
      return false
    }
  }
}