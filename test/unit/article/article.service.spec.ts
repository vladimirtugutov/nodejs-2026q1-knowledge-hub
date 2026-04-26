import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@prisma/client';

import { ArticleService } from '../../../src/article/article.service';
import { ArticleRepository } from '../../../src/article/article.repository';
import { CommentService } from '../../../src/comment/comment.service';
import { NotFoundError } from '../../../src/common/errors/not-found.error';
import { ForbiddenError } from '../../../src/common/errors/forbidden.error';
import { ArticleStatus } from '../../../src/common/enums/article-status.enum';
import type { Article } from '../../../src/article/entities/article.entity';

describe('ArticleService', () => {
  let service: ArticleService;

  const articleRepositoryMock = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  const commentServiceMock = {
    deleteByArticleId: vi.fn(),
  };

  const authorUser = {
    userId: '11111111-1111-4111-8111-111111111111',
    login: 'author',
    role: UserRole.editor,
  };

  const adminUser = {
    userId: '22222222-2222-4222-8222-222222222222',
    login: 'admin',
    role: UserRole.admin,
  };

  const anotherUser = {
    userId: '33333333-3333-4333-8333-333333333333',
    login: 'viewer',
    role: UserRole.viewer,
  };

  const makeArticle = (overrides: Partial<Article> = {}): Article =>
    ({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      title: 'Nest Article',
      content: 'Content',
      status: 'draft' as ArticleStatus,
      authorId: authorUser.userId,
      categoryId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      createdAt: new Date('2026-04-20T10:00:00.000Z'),
      updatedAt: new Date('2026-04-21T10:00:00.000Z'),
      author: null,
      category: null,
      tags: [{ id: '1', name: 'nestjs' }],
      comments: [],
      ...overrides,
    }) as Article;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: ArticleRepository,
          useValue: articleRepositoryMock,
        },
        {
          provide: CommentService,
          useValue: commentServiceMock,
        },
      ],
    }).compile();

    service = module.get(ArticleService);
  });

  describe('findAll', () => {
    it('should return all articles without pagination when query is empty', async () => {
      const articles = [makeArticle(), makeArticle({ id: '2', title: 'Second' })];
      articleRepositoryMock.findAll.mockResolvedValue(articles);

      const result = await service.findAll();

      expect(articleRepositoryMock.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(articles);
    });

    it('should filter articles by status', async () => {
      const articles = [
        makeArticle({ status: ArticleStatus.DRAFT }),
        makeArticle({ id: '2', status: ArticleStatus.PUBLISHED }),
      ];
      articleRepositoryMock.findAll.mockResolvedValue(articles);

      const result = await service.findAll({ status: ArticleStatus.DRAFT });

      expect(result).toHaveLength(1);
      expect((result as Article[])[0].status).toBe(ArticleStatus.DRAFT);
    });

    it('should filter articles by categoryId', async () => {
      const categoryId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
      const otherCategoryId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

      const articles = [
        makeArticle({ categoryId }),
        makeArticle({ id: '2', categoryId: otherCategoryId }),
      ];
      articleRepositoryMock.findAll.mockResolvedValue(articles);

      const result = await service.findAll({ categoryId });

      expect(result).toHaveLength(1);
      expect((result as Article[])[0].categoryId).toBe(categoryId);
    });

    it('should filter articles by tag', async () => {
      const articles = [
        makeArticle({ tags: [{ id: '1', name: 'nestjs' }] }),
        makeArticle({ id: '2', tags: [{ id: '2', name: 'typeorm' }] }),
      ];
      articleRepositoryMock.findAll.mockResolvedValue(articles);

      const result = await service.findAll({ tag: 'nestjs' });

      expect(result).toHaveLength(1);
      expect((result as Article[])[0].tags[0].name).toBe('nestjs');
    });

    it('should sort articles by title in descending order', async () => {
      const articles = [
        makeArticle({ id: '1', title: 'Alpha' }),
        makeArticle({ id: '2', title: 'Zulu' }),
      ];
      articleRepositoryMock.findAll.mockResolvedValue(articles);

      const result = await service.findAll({
        sortBy: 'title',
        order: 'desc',
      });

      expect((result as Article[]).map((article) => article.title)).toEqual([
        'Zulu',
        'Alpha',
      ]);
    });

    it('should ignore unsupported sort field', async () => {
      const articles = [
        makeArticle({ id: '1', title: 'Alpha' }),
        makeArticle({ id: '2', title: 'Zulu' }),
      ];
      articleRepositoryMock.findAll.mockResolvedValue(articles);

      const result = await service.findAll({
        sortBy: 'unknown',
        order: 'desc',
      } as any);

      expect(result).toEqual(articles);
    });

    it('should return paginated response when page and limit are provided', async () => {
      const articles = [
        makeArticle({ id: '1', title: 'First' }),
        makeArticle({ id: '2', title: 'Second' }),
        makeArticle({ id: '3', title: 'Third' }),
      ];
      articleRepositoryMock.findAll.mockResolvedValue(articles);

      const result = await service.findAll({ page: 2, limit: 1 });

      expect(result).toEqual({
        total: 3,
        page: 2,
        limit: 1,
        data: [articles[1]],
      });
    });

    it('should use default pagination values when only page is provided', async () => {
      const articles = Array.from({ length: 12 }, (_, index) =>
        makeArticle({ id: `${index + 1}`, title: `Article ${index + 1}` }),
      );
      articleRepositoryMock.findAll.mockResolvedValue(articles);

      const result = await service.findAll({ page: 2 });

      expect(result).toEqual({
        total: 12,
        page: 2,
        limit: 10,
        data: articles.slice(10, 12),
      });
    });
  });

  describe('findOne', () => {
    it('should return article by id', async () => {
      const article = makeArticle();
      articleRepositoryMock.findOne.mockResolvedValue(article);

      const result = await service.findOne(article.id);

      expect(articleRepositoryMock.findOne).toHaveBeenCalledWith(article.id);
      expect(result).toEqual(article);
    });

    it('should throw NotFoundError when article does not exist', async () => {
      articleRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('missing-id'),
      ).rejects.toThrowError(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create article with authorId from jwt payload', async () => {
      const dto = {
        title: 'New article',
        content: 'New content',
        status: ArticleStatus.DRAFT,
        categoryId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        tags: ['nestjs', 'testing'],
      };

      const createdArticle = makeArticle({
        title: dto.title,
        content: dto.content,
        status: dto.status,
        categoryId: dto.categoryId,
        tags: dto.tags.map((t) => ({ id: t, name: t })),
      });

      articleRepositoryMock.create.mockResolvedValue(createdArticle);

      const result = await service.create(dto, authorUser);

      expect(articleRepositoryMock.create).toHaveBeenCalledWith({
        title: dto.title,
        content: dto.content,
        status: dto.status,
        categoryId: dto.categoryId,
        tags: dto.tags,
        authorId: authorUser.userId,
      });
      expect(result).toEqual(createdArticle);
    });

    it('should create article with null authorId', async () => {
      const dto = {
        title: 'Public article',
        content: 'Public',
        status: ArticleStatus.PUBLISHED,
        categoryId: null,
        tags: ['public'] as string[],
      };

      const created = makeArticle({
        ...dto,
        authorId: null,
        categoryId: null,
        tags: dto.tags.map((t) => ({ id: t, name: t })),
      });

      articleRepositoryMock.create.mockResolvedValue(created);

      const result = await service.create(dto, { ...authorUser, userId: null });

      expect(articleRepositoryMock.create).toHaveBeenCalledWith({
        ...dto,
        authorId: null,
      });
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should throw NotFoundError when article does not exist', async () => {
      articleRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.update(
          'missing-id',
          { title: 'Updated title' },
          authorUser,
        ),
      ).rejects.toThrowError(NotFoundError);

      expect(articleRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when non-author non-admin tries to update article', async () => {
      const article = makeArticle({ authorId: authorUser.userId });
      articleRepositoryMock.findOne.mockResolvedValue(article);

      await expect(
        service.update(article.id, { title: 'Updated title' }, anotherUser),
      ).rejects.toThrowError(ForbiddenError);

      expect(articleRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('should allow author to update own article', async () => {
      const article = makeArticle({ authorId: authorUser.userId });
      const updatedArticle = makeArticle({ title: 'Updated title' });

      articleRepositoryMock.findOne.mockResolvedValue(article);
      articleRepositoryMock.update.mockResolvedValue(updatedArticle);

      const result = await service.update(
        article.id,
        {
          title: 'Updated title',
          content: 'Updated content',
          status: ArticleStatus.PUBLISHED,
          categoryId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          tags: ['updated'],
        },
        authorUser,
      );

      expect(articleRepositoryMock.update).toHaveBeenCalledWith(article.id, {
        title: 'Updated title',
        content: 'Updated content',
        status: ArticleStatus.PUBLISHED,
        categoryId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        tags: ['updated'],
      });
      expect(result).toEqual(updatedArticle);
    });

    it('should allow admin to update чужую article', async () => {
      const article = makeArticle({ authorId: authorUser.userId });
      const updatedArticle = makeArticle({ title: 'Admin updated' });

      articleRepositoryMock.findOne.mockResolvedValue(article);
      articleRepositoryMock.update.mockResolvedValue(updatedArticle);

      const result = await service.update(
        article.id,
        { title: 'Admin updated' },
        adminUser,
      );

      expect(articleRepositoryMock.update).toHaveBeenCalledWith(article.id, {
        title: 'Admin updated',
        content: undefined,
        status: undefined,
        categoryId: undefined,
        tags: undefined,
      });
      expect(result).toEqual(updatedArticle);
    });

    it('should update tags only', async () => {
      const article = makeArticle();
      const updated = makeArticle({
        tags: [{ id: '2', name: 'vue' }],
      });

      articleRepositoryMock.findOne.mockResolvedValue(article);
      articleRepositoryMock.update.mockResolvedValue(updated);

      const result = await service.update(
        article.id,
        {
          tags: ['vue'],
        },
        authorUser,
      );

      expect(articleRepositoryMock.update).toHaveBeenCalledWith(article.id, {
        tags: ['vue'],
        title: undefined,
        content: undefined,
        status: undefined,
        categoryId: undefined,
      });
      expect(result.tags.map((t) => t.name)).toEqual(['vue']);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundError when article does not exist', async () => {
      articleRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrowError(
        NotFoundError,
      );

      expect(commentServiceMock.deleteByArticleId).not.toHaveBeenCalled();
      expect(articleRepositoryMock.remove).not.toHaveBeenCalled();
    });

    it('should delete article comments before removing article', async () => {
      const article = makeArticle();
      articleRepositoryMock.findOne.mockResolvedValue(article);
      commentServiceMock.deleteByArticleId.mockResolvedValue(undefined);
      articleRepositoryMock.remove.mockResolvedValue(true);

      await service.remove(article.id);

      expect(commentServiceMock.deleteByArticleId).toHaveBeenCalledWith(
        article.id,
      );
      expect(articleRepositoryMock.remove).toHaveBeenCalledWith(article.id);
    });
  });

  describe('nullifyAuthorByUserId', () => {
    it('should nullify authorId for all related articles', async () => {
      const articles = [
        makeArticle({ id: '1', authorId: authorUser.userId }),
        makeArticle({ id: '2', authorId: authorUser.userId }),
        makeArticle({ id: '3', authorId: anotherUser.userId }),
      ];
      articleRepositoryMock.findAll.mockResolvedValue(articles);
      articleRepositoryMock.update.mockResolvedValue(makeArticle());

      await service.nullifyAuthorByUserId(authorUser.userId);

      expect(articleRepositoryMock.update).toHaveBeenCalledTimes(2);
      expect(articleRepositoryMock.update).toHaveBeenNthCalledWith(1, '1', {
        authorId: null,
      });
      expect(articleRepositoryMock.update).toHaveBeenNthCalledWith(2, '2', {
        authorId: null,
      });
    });

    it('should not update articles when user has no authored articles', async () => {
      const articles = [
        makeArticle({ id: '1', authorId: anotherUser.userId }),
        makeArticle({ id: '2', authorId: null }),
      ];
      articleRepositoryMock.findAll.mockResolvedValue(articles);
      articleRepositoryMock.update.mockResolvedValue(makeArticle());

      await service.nullifyAuthorByUserId(authorUser.userId);

      expect(articleRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe('nullifyCategoryByCategoryId', () => {
    it('should nullify categoryId for all related articles', async () => {
      const categoryId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
      const articles = [
        makeArticle({ id: '1', categoryId }),
        makeArticle({ id: '2', categoryId }),
        makeArticle({
          id: '3',
          categoryId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        }),
      ];
      articleRepositoryMock.findAll.mockResolvedValue(articles);
      articleRepositoryMock.update.mockResolvedValue(makeArticle());

      await service.nullifyCategoryByCategoryId(categoryId);

      expect(articleRepositoryMock.update).toHaveBeenCalledTimes(2);
      expect(articleRepositoryMock.update).toHaveBeenNthCalledWith(1, '1', {
        categoryId: null,
      });
      expect(articleRepositoryMock.update).toHaveBeenNthCalledWith(2, '2', {
        categoryId: null,
      });
    });

    it('should not update articles when no category matches', async () => {
      const categoryId = 'missing-category';
      const articles = [
        makeArticle({ id: '1', categoryId: 'other' }),
        makeArticle({ id: '2', categoryId: null }),
      ];
      articleRepositoryMock.findAll.mockResolvedValue(articles);
      articleRepositoryMock.update.mockResolvedValue(makeArticle());

      await service.nullifyCategoryByCategoryId(categoryId);

      expect(articleRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should return true when article exists', async () => {
      articleRepositoryMock.findOne.mockResolvedValue(makeArticle());

      await expect(service.exists('existing-id')).resolves.toBe(true);
    });

    it('should return false when article does not exist', async () => {
      articleRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.exists('missing-id')).resolves.toBe(false);
    });
  });

  it('should allow update with null categoryId from author', async () => {
  const article = makeArticle({ authorId: authorUser.userId });
  const updated = makeArticle({ title: 'updated with null category', categoryId: null });

  articleRepositoryMock.findOne.mockResolvedValue(article);
  articleRepositoryMock.update.mockResolvedValue(updated);

  const result = await service.update(
    article.id,
    { categoryId: null },
    authorUser,
  );

  expect(articleRepositoryMock.update).toHaveBeenCalledWith(article.id, {
    categoryId: null,
    title: undefined,
    content: undefined,
    status: undefined,
    tags: undefined,
  });
  expect(result).toEqual(updated);
});
});