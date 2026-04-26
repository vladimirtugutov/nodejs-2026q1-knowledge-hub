import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { LoginDto } from '../../../src/auth/dto/login.dto';
import { RefreshDto } from '../../../src/auth/dto/refresh.dto';
import { SignupDto } from '../../../src/auth/dto/signup.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const serviceMock = {
    login: vi.fn(),
    signup: vi.fn(),
    refresh: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('POST /auth/signup', () => {
    it('should call authService.signup with dto', async () => {
      const dto: SignupDto = {
        login: 'test',
        password: 'pass',
      };

      await controller.signup(dto);

      expect(serviceMock.signup).toHaveBeenCalledWith(dto);
    });
  });

  describe('POST /auth/login', () => {
    it('should call authService.login with dto', async () => {
      const dto: LoginDto = {
        login: 'test',
        password: 'pass',
      };

      await controller.login(dto);

      expect(serviceMock.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should call authService.refresh with dto', async () => {
      const dto: RefreshDto = {
        refreshToken: 'token',
      };

      await controller.refresh(dto);

      expect(serviceMock.refresh).toHaveBeenCalledWith(dto);
    });

    it('should throw UnauthorizedException when refreshToken is missing', async () => {
      await expect(
        async () => controller.refresh({} as RefreshDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});