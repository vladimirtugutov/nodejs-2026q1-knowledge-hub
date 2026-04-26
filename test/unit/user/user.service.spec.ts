import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import * as bcrypt from 'bcryptjs';

import { UserService } from '../../../src/user/user.service';
import { UserRepository } from '../../../src/user/user.repository';
import { ArticleService } from '../../../src/article/article.service';
import { CommentService } from '../../../src/comment/comment.service';
import { ConflictError } from '../../../src/common/errors/conflict.error';
import { NotFoundError } from '../../../src/common/errors/not-found.error';
import { UserRole } from '../../../src/common/enums/user-role.enum';

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  const mockArticleService = {
    nullifyAuthorByUserId: vi.fn(),
  };

  const mockCommentService = {
    deleteByAuthorId: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: ArticleService, useValue: mockArticleService },
        { provide: CommentService, useValue: mockCommentService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('create', () => {
    it('should throw ConflictError if login is taken', async () => {
      mockUserRepository.findAll.mockResolvedValue([
        {
          id: '1',
          login: 'test',
          password: 'hashed-password',
          role: UserRole.VIEWER,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      await expect(
        service.create({
          login: 'test',
          password: 'plain-password',
          role: UserRole.VIEWER,
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should create user and exclude password from response', async () => {
      mockUserRepository.findAll.mockResolvedValue([]);

      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      mockUserRepository.create.mockResolvedValue({
        id: '1',
        login: 'new-user',
        password: 'hashed-password',
        role: UserRole.VIEWER,
        createdAt: 111,
        updatedAt: 222,
      });

      const result = await service.create({
        login: 'new-user',
        password: 'plain-password',
        role: UserRole.VIEWER,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        login: 'new-user',
        password: 'hashed-password',
        role: UserRole.VIEWER,
      });
      expect(result).toEqual({
        id: '1',
        login: 'new-user',
        role: UserRole.VIEWER,
        createdAt: 111,
        updatedAt: 222,
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundError if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundError);
    });

    it('should return user without password', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        login: 'john',
        password: 'hashed-password',
        role: UserRole.ADMIN,
        createdAt: 111,
        updatedAt: 222,
      });

      const result = await service.findOne('1');

      expect(result).toEqual({
        id: '1',
        login: 'john',
        role: UserRole.ADMIN,
        createdAt: 111,
        updatedAt: 222,
      });
      expect(result).not.toHaveProperty('password');
    });
  });
});