import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  const context = {
    getHandler: vi.fn(() => ({})),
    getClass: vi.fn(() => ({})),
    switchToHttp: vi.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: reflector,
        },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
    vi.clearAllMocks();
  });

  it('returns true for public route', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('delegates to passport auth guard for protected route', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    const parentCanActivate = vi
      .spyOn(PassportAuthGuard('jwt').prototype, 'canActivate')
      .mockReturnValue(true as never);

    const result = guard.canActivate(context);

    expect(parentCanActivate).toHaveBeenCalledWith(context);
    expect(result).toBe(true);

    parentCanActivate.mockRestore();
  });

  it('returns user from handleRequest when user exists', () => {
    const user = { id: '1', login: 'test' };

    expect(guard.handleRequest(null, user)).toEqual(user);
  });

  it('throws provided error from handleRequest', () => {
    const error = new UnauthorizedException('jwt expired');

    expect(() => guard.handleRequest(error, null)).toThrow(error);
  });

  it('throws UnauthorizedException when user is missing and error is absent', () => {
    expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException);
  });
});