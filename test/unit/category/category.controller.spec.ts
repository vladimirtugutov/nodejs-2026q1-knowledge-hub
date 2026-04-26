import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CategoryController } from '../../../src/category/category.controller';
import { CategoryService } from '../../../src/category/category.service';
import { CreateCategoryDto } from '../../../src/category/dto/create-category.dto';
import { UpdateCategoryDto } from '../../../src/category/dto/update-category.dto';

describe('CategoryController', () => {
  let controller: CategoryController;

  const categoryServiceMock = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: categoryServiceMock,
        },
      ],
    }).compile();

    controller = module.get(CategoryController);
  });

  describe('GET /category', () => {
    it('should call categoryService.findAll with pagination query', () => {
      const query = { page: 1, limit: 10 };

      controller.findAll(query);

      expect(categoryServiceMock.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('GET /category/:id', () => {
    it('should call categoryService.findOne with id', () => {
      const id = '1';

      controller.findOne(id);

      expect(categoryServiceMock.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('POST /category', () => {
    it('should call categoryService.create with dto', () => {
      const dto: CreateCategoryDto = {
        name: 'TEST_CATEGORY',
        description: 'Test description',
      };

      controller.create(dto);

      expect(categoryServiceMock.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('PUT /category/:id', () => {
    it('should call categoryService.update with id and dto', () => {
      const id = '1';
      const dto: UpdateCategoryDto = {
        name: 'Updated name',
        description: 'Updated description',
      };

      controller.update(id, dto);

      expect(categoryServiceMock.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('DELETE /category/:id', () => {
    it('should call categoryService.remove with id', async () => {
      const id = '1';

      await controller.remove(id);

      expect(categoryServiceMock.remove).toHaveBeenCalledWith(id);
    });
  });
});