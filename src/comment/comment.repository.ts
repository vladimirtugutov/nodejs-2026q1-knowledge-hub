import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Comment } from './entities/comment.entity'

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Comment[]> {
    return this.prisma.comment.findMany()
  }

  async findOne(id: string): Promise<Comment | null> {
    return this.prisma.comment.findUnique({
      where: { id },
    })
  }

  async create(data: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    return this.prisma.comment.create({
      data: {
        content: data.content,
        articleId: data.articleId,
        authorId: data.authorId ?? null,
      },
    })
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.comment.delete({
        where: { id },
      })
      return true
    } catch {
      return false
    }
  }

  async removeMany(ids: string[]): Promise<number> {
    const result = await this.prisma.comment.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    return result.count
  }
}