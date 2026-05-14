import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@prisma/client';

import { UserController } from '../../../src/user/user.controller';
import { UserService } from '../../../src/user/user.service';
import { CreateUserDto } from '../../../src/user/dto/create-user.dto';
import { UpdatePasswordDto } from '../../../src/user/dto/update-password.dto';

describe('UserController', () => {
  let controller: UserController;

  const userServiceMock = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    updatePassword: vi.fn(),
    remove: vi.fn(),
  };

  const user = {
    userId: '11111111-1111-4111-8111-111111111111',
    role: UserRole.viewer,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userServiceMock,
        },
      ],
    }).compile();

    controller = module.get(UserController);
  });

  describe('GET /user', () => {
    it('should call userService.findAll with pagination query', () => {
      const query = { page: 1, limit: 10 };

      controller.findAll(query);

      expect(userServiceMock.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('GET /user/:id', () => {
    it('should call userService.findOne with id', () => {
      const id = '1';

      controller.findOne(id);

      expect(userServiceMock.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('POST /user', () => {
    it('should call userService.create with dto', () => {
      const dto: CreateUserDto = {
        login: 'testlogin',
        password: 'testpassword',
        role: UserRole.viewer,
      };

      controller.create(dto);

      expect(userServiceMock.create).toHaveBeenCalledWith(dto);
    });
  });

    describe('PUT /user/:id', () => {
        it('should call userService.updatePassword with id and dto for own profile', async () => {
        const id = user.userId;
        const dto: UpdatePasswordDto = {
            oldPassword: 'old',
            newPassword: 'new',
        };

        await controller.updatePassword(id, dto, user);

        expect(userServiceMock.updatePassword).toHaveBeenCalledWith(id, dto);
        });

        it('should allow admin to update any user password', async () => {
        const adminUser = {
            userId: '22222222-2222-4222-8222-222222222222',
            role: UserRole.admin,
        };

        const id = '33333333-3333-4333-8333-333333333333';
        const dto: UpdatePasswordDto = {
            oldPassword: 'old',
            newPassword: 'new',
        };

        await controller.updatePassword(id, dto, adminUser);

        expect(userServiceMock.updatePassword).toHaveBeenCalledWith(id, dto);
        });

        it('should throw ForbiddenException when non-admin updates another user password', async () => {
        const dto: UpdatePasswordDto = {
            oldPassword: 'old',
            newPassword: 'new',
        };

        await expect(
            controller.updatePassword(
            '33333333-3333-4333-8333-333333333333',
            dto,
            user,
            ),
        ).rejects.toThrow('You can update only your own password');

        expect(userServiceMock.updatePassword).not.toHaveBeenCalled();
        });
    });

  describe('DELETE /user/:id', () => {
    it('should call userService.remove with id', async () => {
      const id = '1';

      await controller.remove(id);

      expect(userServiceMock.remove).toHaveBeenCalledWith(id);
    });
  });
});