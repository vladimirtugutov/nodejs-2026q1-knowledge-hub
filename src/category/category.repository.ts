import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryRepository {
  private categories: Category[] = [];

  async findAll(): Promise<Category[]> {
    return [...this.categories];
  }

  async findOne(id: string): Promise<Category | null> {
    return this.categories.find((category) => category.id === id) ?? null;
  }

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const category: Category = {
      id: randomUUID(),
      ...data,
    };

    this.categories.push(category);
    return category;
  }

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    const index = this.categories.findIndex((category) => category.id === id);

    if (index === -1) {
      return null;
    }

    this.categories[index] = {
      ...this.categories[index],
      ...data,
    };

    return this.categories[index];
  }

  async remove(id: string): Promise<boolean> {
    const index = this.categories.findIndex((category) => category.id === id);

    if (index === -1) {
      return false;
    }

    this.categories.splice(index, 1);
    return true;
  }
}