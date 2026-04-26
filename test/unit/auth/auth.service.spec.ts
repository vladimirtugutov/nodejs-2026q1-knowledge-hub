import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuthService } from '../../../src/auth/auth.service';
import { ConflictError } from '../../../src/common/errors/conflict.error';
import { ForbiddenError } from '../../../src/common/errors/forbidden.error';
import { UserRole } from '@prisma/client';

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockJwtService = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn(),
    getOrThrow: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string, defaultValue?: string) => {
      const config = {
        CRYPT_SALT: '10',
        JWT_SECRET_KEY: 'secret',
        TOKEN_EXPIRE_TIME: '15m',
        JWT_SECRET_REFRESH_KEY: 'refresh-secret',
        TOKEN_REFRESH_EXPIRE_TIME: '7d',
      };

      return config[key as keyof typeof config] ?? defaultValue;
    });

    mockConfigService.getOrThrow.mockImplementation((key: string) => {
      const value = mockConfigService.get(key);
      if (value === undefined) {
        throw new Error(`Missing config key: ${key}`);
      }
      return value;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should throw ConflictError if login exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(
        service.signup({ login: 'test', password: 'pass' }),
      ).rejects.toThrow(ConflictError);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { login: 'test' },
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should create user with viewer role and return without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashed-pass');

      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        login: 'new',
        role: UserRole.viewer,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.signup({ login: 'new', password: 'pass' });

      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          login: 'new',
          password: 'hashed-pass',
          role: UserRole.viewer,
        },
        select: {
          id: true,
          login: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual({
        id: '1',
        login: 'new',
        role: UserRole.viewer,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('login', () => {
    it('should throw ForbiddenError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ login: 'missing', password: 'pass' }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { login: 'missing' },
      });
    });

    it('should throw ForbiddenError if password wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        login: 'test',
        role: UserRole.viewer,
        password: 'wrong-hash',
      });

      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.login({ login: 'test', password: 'wrong' }),
      ).rejects.toThrow(ForbiddenError);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'wrong-hash');
    });

    it('should login and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        login: 'test',
        role: UserRole.viewer,
        password: 'stored-hash',
      });

      (bcrypt.compare as any).mockResolvedValue(true);

      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      (bcrypt.hash as any).mockResolvedValue('stored-refresh-hash');
      mockPrisma.user.update.mockResolvedValue({});

      const tokens = await service.login({ login: 'test', password: 'pass' });

      expect(tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          userId: '1',
          login: 'test',
          role: UserRole.viewer,
        },
        {
          secret: 'secret',
          expiresIn: '15m',
        },
      );
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        {
          userId: '1',
          login: 'test',
          role: UserRole.viewer,
        },
        {
          secret: 'refresh-secret',
          expiresIn: '7d',
        },
      );

      expect(bcrypt.compare).toHaveBeenCalledWith('pass', 'stored-hash');
      expect(bcrypt.hash).toHaveBeenCalledWith('refresh-token', 10);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { refreshTokenHash: 'stored-refresh-hash' },
      });
    });
  });

  describe('refresh', () => {
    it('should throw ForbiddenError when refresh token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

      await expect(
        service.refresh({ refreshToken: 'bad-refresh-token' }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'bad-refresh-token',
        {
          secret: 'refresh-secret',
        },
      );
    });

    it('should throw ForbiddenError when user does not have refreshTokenHash', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        userId: '1',
        login: 'test',
        role: UserRole.viewer,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        login: 'test',
        role: UserRole.viewer,
        refreshTokenHash: null,
      });

      await expect(
        service.refresh({ refreshToken: 'valid-refresh-token' }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw ForbiddenError when refresh token hash does not match', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        userId: '1',
        login: 'test',
        role: UserRole.viewer,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        login: 'test',
        role: UserRole.viewer,
        refreshTokenHash: 'stored-hash',
      });

      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.refresh({ refreshToken: 'wrong-refresh-token' }),
      ).rejects.toThrow(ForbiddenError);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrong-refresh-token',
        'stored-hash',
      );
    });

    it('should return new tokens and rotate refresh token hash', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        userId: '1',
        login: 'test',
        role: UserRole.viewer,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        login: 'test',
        role: UserRole.viewer,
        refreshTokenHash: 'stored-refresh-hash',
      });

      (bcrypt.compare as any).mockResolvedValue(true);

      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      (bcrypt.hash as any).mockResolvedValue('new-refresh-hash');
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.refresh({
        refreshToken: 'valid-refresh-token',
      });

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-refresh-token',
        {
          secret: 'refresh-secret',
        },
      );

      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          userId: '1',
          login: 'test',
          role: UserRole.viewer,
        },
        {
          secret: 'secret',
          expiresIn: '15m',
        },
      );

      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        {
          userId: '1',
          login: 'test',
          role: UserRole.viewer,
        },
        {
          secret: 'refresh-secret',
          expiresIn: '7d',
        },
      );

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'valid-refresh-token',
        'stored-refresh-hash',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('new-refresh-token', 10);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { refreshTokenHash: 'new-refresh-hash' },
      });
    });
  });
});