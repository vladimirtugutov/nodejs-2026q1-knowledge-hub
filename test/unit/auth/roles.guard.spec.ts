import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../../../src/auth/guards/roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  const request = {
    user: undefined as { role?: UserRole } | undefined,
  };

  const context = {
    getHandler: vi.fn(() => ({})),
    getClass: vi.fn(() => ({})),
    switchToHttp: vi.fn(() => ({
      getRequest: () => request,
    })),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: reflector,
        },
      ],
    }).compile();

    guard = module.get(RolesGuard);
    request.user = undefined;
    vi.clearAllMocks();
  });

  it('returns true when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('returns true when required roles are empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('returns true when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.viewer]);
    request.user = { role: UserRole.viewer };

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when user is missing', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.admin]);
    request.user = undefined;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user role is missing', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.admin]);
    request.user = {};

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user lacks required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.admin]);
    request.user = { role: UserRole.viewer };

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});