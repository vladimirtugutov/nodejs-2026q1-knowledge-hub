import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@prisma/client';

import { CommentController } from '../../../src/comment/comment.controller';
import { CommentService } from '../../../src/comment/comment.service';
import { CreateCommentDto } from '../../../src/comment/dto/create-comment.dto';

describe('CommentController', () => {
  let controller: CommentController;

  const commentServiceMock = {
    findByArticleId: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
  };

  const user = {
    userId: '11111111-1111-4111-8111-111111111111',
    role: UserRole.editor,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: commentServiceMock,
        },
      ],
    }).compile();

    controller = module.get(CommentController);
  });

  describe('findByArticleId', () => {
    it('should call commentService.findByArticleId with query', () => {
      const query = {
        articleId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc' as const,
      };

      controller.findByArticleId(query);

      expect(commentServiceMock.findByArticleId).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should call commentService.findOne with id', () => {
      const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

      controller.findOne(id);

      expect(commentServiceMock.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('create', () => {
    it('should call commentService.create with dto and user', () => {
      const dto: CreateCommentDto = {
        content: 'Editor comment',
        articleId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      };

      controller.create(dto, user);

      expect(commentServiceMock.create).toHaveBeenCalledWith(dto, user);
    });

    it('should pass nullable authorId in dto without changing it', () => {
      const dto: CreateCommentDto = {
        content: 'Editor comment',
        articleId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        authorId: null,
      };

      controller.create(dto, user);

      expect(commentServiceMock.create).toHaveBeenCalledWith(dto, user);
    });
  });

  describe('remove', () => {
    it('should call commentService.remove with id and user', async () => {
      const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

      await controller.remove(id, user);

      expect(commentServiceMock.remove).toHaveBeenCalledWith(id, user);
    });
  });
});