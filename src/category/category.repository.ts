import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Category } from './entities/category.entity'

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany()
  }

  async findOne(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id },
    })
  }

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    return this.prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
      },
    })
  }

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
        },
      })
    } catch {
      return null
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.category.delete({
        where: { id },
      })
      return true
    } catch {
      return false
    }
  }
}