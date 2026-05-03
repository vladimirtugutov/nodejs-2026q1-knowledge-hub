import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpStatus } from '@nestjs/common';

import { ArticleController } from '../../../src/article/article.controller';
import { ArticleService } from '../../../src/article/article.service';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../../../src/auth/types/jwt-payload.type';
import { CreateArticleDto } from '../../../src/article/dto/create-article.dto';
import { UpdateArticleDto } from '../../../src/article/dto/update-article.dto';
import { QueryArticleDto } from '../../../src/article/dto/query-article.dto';
import { Article } from '../../../src/article/entities/article.entity';

const authorUser = {
  userId: '11111111-1111-4111-8111-111111111111',
  role: UserRole.editor,
} as const;

const adminUser = {
  userId: '22222222-2222-4222-8222-222222222222',
  role: UserRole.admin,
} as const;

const makeArticle = (overrides: Partial<Article> = {}): Article =>
  ({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'NestJS Article',
    content: 'Content',
    status: 'draft',
    authorId: authorUser.userId,
    categoryId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    createdAt: new Date(),
    updatedAt: new Date(),
    author: null,
    category: null,
    tags: [],
    comments: [],
    ...overrides,
  }) as Article;

const validQuery = {
  status: 'draft',
  categoryId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  tag: 'nestjs',
  page: 2,
  limit: 10,
  sortBy: 'title',
  order: 'asc',
};

describe('ArticleController', () => {
  let controller: ArticleController;
  let service: ArticleService;

  const serviceMock = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get(ArticleController);
    service = module.get(ArticleService);
  });

  describe('GET /article', () => {
    it('should call articleService.findAll with empty query', () => {
      controller.findAll({});

      expect(serviceMock.findAll).toHaveBeenCalledWith({ page: undefined, limit: undefined });
    });

    it('should pass query params to articleService.findAll', () => {
      controller.findAll(validQuery);

      expect(serviceMock.findAll).toHaveBeenCalledWith(validQuery);
    });
  });

  describe('GET /article/:id', () => {
    it('should call articleService.findOne with id', () => {
      const id = '1';

      controller.findOne(id);

      expect(serviceMock.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('POST /article', () => {
    it('should call articleService.create with dto and user', () => {
      const dto: CreateArticleDto = {
        title: 'New article',
        content: 'New content',
        status: 'draft',
        categoryId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        tags: ['nestjs'],
      };

      controller.create(dto, authorUser);

      expect(serviceMock.create).toHaveBeenCalledWith(dto, authorUser);
    });
  });

  describe('PUT /article/:id', () => {
    it('should call articleService.update with id, dto and user', () => {
      const id = '1';
      const dto: UpdateArticleDto = {
        title: 'Updated title',
        content: 'Updated content',
        status: 'published',
        categoryId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        tags: ['updated'],
      };

      controller.update(id, dto, authorUser);

      expect(serviceMock.update).toHaveBeenCalledWith(id, dto, authorUser);
    });
  });

  describe('DELETE /article/:id', () => {
    it('should call articleService.remove with id', async () => {
      const id = '1';

      await controller.remove(id);

      expect(serviceMock.remove).toHaveBeenCalledWith(id);
    });
  });
});