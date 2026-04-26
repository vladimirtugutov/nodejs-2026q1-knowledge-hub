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
import { ForbiddenError } from '../../../src/common/errors/forbidden.error';

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

      (bcrypt.hash as any).mockResolvedValue('hashed-password');

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

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      mockUserRepository.findAll.mockResolvedValue([
        {
          id: '1',
          login: 'alice',
          password: 'hashed-1',
          role: UserRole.VIEWER,
          createdAt: 111,
          updatedAt: 222,
        },
        {
          id: '2',
          login: 'bob',
          password: 'hashed-2',
          role: UserRole.ADMIN,
          createdAt: 333,
          updatedAt: 444,
        },
      ]);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          id: '1',
          login: 'alice',
          role: UserRole.VIEWER,
          createdAt: 111,
          updatedAt: 222,
        },
        {
          id: '2',
          login: 'bob',
          role: UserRole.ADMIN,
          createdAt: 333,
          updatedAt: 444,
        },
      ]);
    });

    it('should return paginated users without passwords', async () => {
      mockUserRepository.findAll.mockResolvedValue([
        {
          id: '1',
          login: 'alice',
          password: 'hashed-1',
          role: UserRole.VIEWER,
          createdAt: 111,
          updatedAt: 222,
        },
        {
          id: '2',
          login: 'bob',
          password: 'hashed-2',
          role: UserRole.ADMIN,
          createdAt: 333,
          updatedAt: 444,
        },
      ]);

      const result = await service.findAll({ page: 1, limit: 1 });

      expect(result).toEqual({
        total: 2,
        page: 1,
        limit: 1,
        data: [
          {
            id: '1',
            login: 'alice',
            role: UserRole.VIEWER,
            createdAt: 111,
            updatedAt: 222,
          },
        ],
      });
    });

    it('should sort users by login', async () => {
      mockUserRepository.findAll.mockResolvedValue([
        {
          id: '1',
          login: 'zebra',
          password: 'hashed-1',
          role: UserRole.VIEWER,
          createdAt: 111,
          updatedAt: 222,
        },
        {
          id: '2',
          login: 'apple',
          password: 'hashed-2',
          role: UserRole.ADMIN,
          createdAt: 333,
          updatedAt: 444,
        },
      ]);

      const result = await service.findAll({
        sortBy: 'login',
        order: 'asc',
      });

      expect(result).toEqual([
        {
          id: '2',
          login: 'apple',
          role: UserRole.ADMIN,
          createdAt: 333,
          updatedAt: 444,
        },
        {
          id: '1',
          login: 'zebra',
          role: UserRole.VIEWER,
          createdAt: 111,
          updatedAt: 222,
        },
      ]);
    });
  });

  describe('updatePassword', () => {
    it('should throw NotFoundError if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePassword('missing-id', {
          oldPassword: 'old-password',
          newPassword: 'new-password',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if old password is incorrect', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        login: 'john',
        password: 'hashed-password',
        role: UserRole.ADMIN,
        createdAt: 111,
        updatedAt: 222,
      });

      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.updatePassword('1', {
          oldPassword: 'wrong-password',
          newPassword: 'new-password',
        }),
      ).rejects.toThrow(ForbiddenError);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
    });

    it('should update password and exclude it from response', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        login: 'john',
        password: 'hashed-password',
        role: UserRole.ADMIN,
        createdAt: 111,
        updatedAt: 222,
      });

      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue('new-hashed-password');

      mockUserRepository.update.mockResolvedValue({
        id: '1',
        login: 'john',
        password: 'new-hashed-password',
        role: UserRole.ADMIN,
        createdAt: 111,
        updatedAt: 333,
      });

      const result = await service.updatePassword('1', {
        oldPassword: 'old-password',
        newPassword: 'new-password',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('old-password', 'hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);
      expect(mockUserRepository.update).toHaveBeenCalledWith('1', {
        password: 'new-hashed-password',
      });
      expect(result).toEqual({
        id: '1',
        login: 'john',
        role: UserRole.ADMIN,
        createdAt: 111,
        updatedAt: 333,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundError if updated user is null', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        login: 'john',
        password: 'hashed-password',
        role: UserRole.ADMIN,
        createdAt: 111,
        updatedAt: 222,
      });

      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue('new-hashed-password');
      mockUserRepository.update.mockResolvedValue(null);

      await expect(
        service.updatePassword('1', {
          oldPassword: 'old-password',
          newPassword: 'new-password',
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundError if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(NotFoundError);

      expect(mockArticleService.nullifyAuthorByUserId).not.toHaveBeenCalled();
      expect(mockCommentService.deleteByAuthorId).not.toHaveBeenCalled();
      expect(mockUserRepository.remove).not.toHaveBeenCalled();
    });

    it('should cleanup related data and remove user', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        login: 'john',
        password: 'hashed-password',
        role: UserRole.ADMIN,
        createdAt: 111,
        updatedAt: 222,
      });

      mockArticleService.nullifyAuthorByUserId.mockResolvedValue(undefined);
      mockCommentService.deleteByAuthorId.mockResolvedValue(undefined);
      mockUserRepository.remove.mockResolvedValue(true);

      await service.remove('1');

      expect(mockArticleService.nullifyAuthorByUserId).toHaveBeenCalledWith('1');
      expect(mockCommentService.deleteByAuthorId).toHaveBeenCalledWith('1');
      expect(mockUserRepository.remove).toHaveBeenCalledWith('1');
    });
  });
});