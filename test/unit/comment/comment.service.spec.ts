import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@prisma/client';

import { CommentService } from '../../../src/comment/comment.service';
import { CommentRepository } from '../../../src/comment/comment.repository';
import { ArticleService } from '../../../src/article/article.service';
import { NotFoundError } from '../../../src/common/errors/not-found.error';
import { ForbiddenError } from '../../../src/common/errors/forbidden.error';
import { UnprocessableEntityError } from '../../../src/common/errors/unprocessable-entity.error';
import { Comment } from '../../../src/comment/entities/comment.entity';

const authorUser = {
  userId: '11111111-1111-4111-8111-111111111111',
  role: UserRole.editor,
} as const;

const adminUser = {
  userId: '22222222-2222-4222-8222-222222222222',
  role: UserRole.admin,
} as const;

const anotherUser = {
  userId: '33333333-3333-4333-8333-333333333333',
  role: UserRole.viewer,
} as const;

const makeComment = (overrides: Partial<Comment> = {}): Comment =>
  ({
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    content: 'Comment',
    articleId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    authorId: authorUser.userId,
    createdAt: new Date(),
    ...overrides,
  }) as Comment;

const validUuid = '11111111-1111-4111-8111-111111111111';
const validArticleId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const createCommentData = {
  content: 'Editor comment',
  articleId: validArticleId,
  authorId: validUuid,
};

describe('CommentService', () => {
  let service: CommentService;

  const commentRepositoryMock = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    removeMany: vi.fn(),
  };

  const articleServiceMock = {
    exists: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: CommentRepository,
          useValue: commentRepositoryMock,
        },
        {
          provide: ArticleService,
          useValue: articleServiceMock,
        },
      ],
    }).compile();

    service = module.get(CommentService);
  });

  describe('findByArticleId', () => {
    const comments = [
      makeComment({ id: '1' }),
      makeComment({ id: '2', articleId: 'other-id' }),
    ];

    it('should return comments filtered by articleId', async () => {
      commentRepositoryMock.findAll.mockResolvedValue(comments);

      const query = { articleId: validArticleId };
      const result = await service.findByArticleId(query);

      expect(result).toHaveLength(1);
      expect((result as Comment[])[0].id).toBe('1');
    });

    it('should sort by createdAt in descending order', async () => {
      const comments = [
        makeComment({
          id: '1',
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        }),
        makeComment({
          id: '2',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ];
      commentRepositoryMock.findAll.mockResolvedValue(comments);

      const query = { articleId: validArticleId, sortBy: 'createdAt', order: 'desc' };
      const result = await service.findByArticleId(query);

      expect((result as Comment[])[0].id).toBe('2');
    });

    it('should return paginated response when page and limit are provided', async () => {
      const comments = Array.from({ length: 12 }, (_, i) =>
        makeComment({ id: `${i + 1}`, articleId: validArticleId }),
      );
      commentRepositoryMock.findAll.mockResolvedValue(comments);

      const query = { articleId: validArticleId, page: 2, limit: 10 };
      const result = await service.findByArticleId(query);

      expect(result).toEqual({
        total: 12,
        page: 2,
        limit: 10,
        data: comments.slice(10, 12),
      });
    });
  });

  describe('findOne', () => {
    it('should return comment by id', async () => {
      const comment = makeComment();
      commentRepositoryMock.findOne.mockResolvedValue(comment);

      const result = await service.findOne(comment.id);

      expect(commentRepositoryMock.findOne).toHaveBeenCalledWith(comment.id);
      expect(result).toEqual(comment);
    });

    it('should throw NotFoundError when comment does not exist', async () => {
      commentRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('missing-id'),
      ).rejects.toThrowError(NotFoundError);

      expect(commentRepositoryMock.findOne).toHaveBeenCalledWith('missing-id');
    });
  });

  describe('create', () => {
    it('should throw UnprocessableEntityError when article does not exist', async () => {
      articleServiceMock.exists.mockResolvedValue(false);

      const dto = {
        content: 'New comment',
        articleId: 'article-does-not-exist',
      };

      await expect(
        service.create(dto, authorUser),
      ).rejects.toThrowError(UnprocessableEntityError);

      expect(articleServiceMock.exists).toHaveBeenCalledWith(dto.articleId);
      expect(commentRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('should create comment when article exists', async () => {
      articleServiceMock.exists.mockResolvedValue(true);

      const dto = {
        content: 'New comment',
        articleId: validArticleId,
      };

      const createdComment = makeComment({ content: dto.content });

      commentRepositoryMock.create.mockResolvedValue(createdComment);

      const result = await service.create(dto, authorUser);

      expect(commentRepositoryMock.create).toHaveBeenCalledWith({
        content: dto.content,
        articleId: dto.articleId,
        authorId: authorUser.userId,
      });
      expect(result).toEqual(createdComment);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundError when comment does not exist', async () => {
      commentRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.remove('missing-id', authorUser),
      ).rejects.toThrowError(NotFoundError);

      expect(commentRepositoryMock.remove).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when non-author non-admin tries to delete comment', async () => {
      const comment = makeComment({ authorId: authorUser.userId });
      commentRepositoryMock.findOne.mockResolvedValue(comment);

      await expect(
        service.remove(comment.id, anotherUser),
      ).rejects.toThrowError(ForbiddenError);

      expect(commentRepositoryMock.remove).not.toHaveBeenCalled();
    });

    it('should allow author to delete own comment', async () => {
      const comment = makeComment({ authorId: authorUser.userId });
      commentRepositoryMock.findOne.mockResolvedValue(comment);
      commentRepositoryMock.remove.mockResolvedValue(true);

      await service.remove(comment.id, authorUser);

      expect(commentRepositoryMock.remove).toHaveBeenCalledWith(comment.id);
    });

    it('should allow admin to delete чужую comment', async () => {
      const comment = makeComment({ authorId: authorUser.userId });
      commentRepositoryMock.findOne.mockResolvedValue(comment);
      commentRepositoryMock.remove.mockResolvedValue(true);

      await service.remove(comment.id, adminUser);

      expect(commentRepositoryMock.remove).toHaveBeenCalledWith(comment.id);
    });
  });

  describe('deleteByArticleId', () => {
    it('should remove all comments linked to given articleId', async () => {
      const articleId = 'article-x';
      const comments = [
        makeComment({ id: '1', articleId }),
        makeComment({ id: '2', articleId }),
        makeComment({ id: '3', articleId: 'other-id' }),
      ];

      commentRepositoryMock.findAll.mockResolvedValue(comments);
      commentRepositoryMock.removeMany.mockResolvedValue(2);

      await service.deleteByArticleId(articleId);

      expect(commentRepositoryMock.removeMany).toHaveBeenCalledWith(['1', '2']);
    });

    it('should not call removeMany when no comments match articleId', async () => {
      const otherId = 'other-id';
      const comments = [
        makeComment({ id: '1', articleId: otherId }),
        makeComment({ id: '2', articleId: otherId }),
      ];

      commentRepositoryMock.findAll.mockResolvedValue(comments);
      commentRepositoryMock.removeMany.mockResolvedValue(0);

      await service.deleteByArticleId('article-x');

      expect(commentRepositoryMock.removeMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteByAuthorId', () => {
    it('should remove all comments linked to given authorId', async () => {
      const authorId = 'author-x';
      const comments = [
        makeComment({ id: '1', authorId }),
        makeComment({ id: '2', authorId }),
        makeComment({ id: '3', authorId: 'other-author' }),
      ];

      commentRepositoryMock.findAll.mockResolvedValue(comments);
      commentRepositoryMock.removeMany.mockResolvedValue(2);

      await service.deleteByAuthorId(authorId);

      expect(commentRepositoryMock.removeMany).toHaveBeenCalledWith(['1', '2']);
    });

    it('should not call removeMany when no comments match authorId', async () => {
      const otherId = 'other-author';
      const comments = [
        makeComment({ id: '1', authorId: otherId }),
        makeComment({ id: '2', authorId: otherId }),
      ];

      commentRepositoryMock.findAll.mockResolvedValue(comments);
      commentRepositoryMock.removeMany.mockResolvedValue(0);

      await service.deleteByAuthorId('author-x');

      expect(commentRepositoryMock.removeMany).not.toHaveBeenCalled();
    });
  });
});