import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CategoryService } from '../../../src/category/category.service';
import { CategoryRepository } from '../../../src/category/category.repository';
import { ArticleService } from '../../../src/article/article.service';
import { NotFoundError } from '../../../src/common/errors/not-found.error';
import { CreateCategoryDto } from '../../../src/category/dto/create-category.dto';
import { UpdateCategoryDto } from '../../../src/category/dto/update-category.dto';

import { ForbiddenError } from '../../../src/common/errors/forbidden.error';

const categoryRepositoryMock = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

const articleServiceMock = {
  nullifyCategoryByCategoryId: vi.fn(),
};

const makeCategory = (overrides: Partial<any> = {}): any =>
  ({
    id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    name: 'TestCategory',
    description: 'Test category',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: CategoryRepository, useValue: categoryRepositoryMock },
        { provide: ArticleService, useValue: articleServiceMock },
      ],
    }).compile();

    service = module.get(CategoryService);
  });

  describe('findAll', () => {
    it('should return all categories without pagination when query is empty', async () => {
      const categories = [makeCategory(), makeCategory({ id: '2' })];

      categoryRepositoryMock.findAll.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(categoryRepositoryMock.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(categories);
    });

    it('should paginate categories when page and limit are provided', async () => {
      const categories = Array.from({ length: 12 }, (_, i) =>
        makeCategory({ id: `${i + 1}`, name: `Category ${i + 1}` }),
      );

      categoryRepositoryMock.findAll.mockResolvedValue(categories);

      const result = await service.findAll({
        page: 2,
        limit: 10,
      });

      expect(categoryRepositoryMock.findAll).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        total: 12,
        page: 2,
        limit: 10,
        data: categories.slice(10, 12),
      });
    });

    it('should sort categories by name in descending order', async () => {
      const categories = [
        makeCategory({ id: '1', name: 'Apple' }),
        makeCategory({ id: '2', name: 'Zebra' }),
      ];

      categoryRepositoryMock.findAll.mockResolvedValue(categories);

      const result = await service.findAll({
        sortBy: 'name',
        order: 'desc',
      });

      const names = (result as any[]).map((c) => c.name);
      expect(names).toEqual(['Zebra', 'Apple']);
    });

    it('should ignore unsupported sort field', async () => {
      const categories = [makeCategory()];

      categoryRepositoryMock.findAll.mockResolvedValue(categories);

      const result = await service.findAll({
        sortBy: 'unknown',
      } as any);

      expect(result).toEqual(categories);
    });
  });

  describe('findOne', () => {
    it('should return category by id', async () => {
      const category = makeCategory();

      categoryRepositoryMock.findOne.mockResolvedValue(category);

      const result = await service.findOne(category.id);

      expect(categoryRepositoryMock.findOne).toHaveBeenCalledWith(category.id);
      expect(result).toEqual(category);
    });

    it('should throw NotFoundError when category does not exist', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('missing-id'),
      ).rejects.toThrowError(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create category with description', async () => {
      const dto: CreateCategoryDto = {
        name: 'TestCategory',
        description: 'Test description',
      };

      const created = makeCategory({ id: '1', ...dto });

      categoryRepositoryMock.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(categoryRepositoryMock.create).toHaveBeenCalledWith({
        name: dto.name,
        description: dto.description,
      });
      expect(result).toEqual(created);
    });

    it('should create category with null description if description is undefined', async () => {
      const dto = {
        name: 'TestCategory',
      } as CreateCategoryDto;

      const created = makeCategory({
        id: '1',
        name: dto.name,
        description: null,
      });

      categoryRepositoryMock.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(categoryRepositoryMock.create).toHaveBeenCalledWith({
        name: dto.name,
        description: null,
      });
      expect(result).toEqual(created);
    });

    it('should keep empty string description as is', async () => {
      const dto: CreateCategoryDto = {
        name: 'TestCategory',
        description: '',
      };

      const created = makeCategory({
        id: '1',
        name: dto.name,
        description: '',
      });

      categoryRepositoryMock.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(categoryRepositoryMock.create).toHaveBeenCalledWith({
        name: dto.name,
        description: '',
      });
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should throw NotFoundError when category does not exist', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue(null);

      const dto: UpdateCategoryDto = {
        name: 'Updated name',
        description: 'Updated description',
      };

      await expect(
        service.update('missing-id', dto),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should update only name', async () => {
      const existed = makeCategory();

      categoryRepositoryMock.findOne.mockResolvedValue(existed);
      categoryRepositoryMock.update.mockResolvedValue({
        ...existed,
        name: 'Updated name',
      });

      const dto: UpdateCategoryDto = {
        name: 'Updated name',
      };

      const result = await service.update(existed.id, dto);

      expect(categoryRepositoryMock.update).toHaveBeenCalledWith(existed.id, {
        name: 'Updated name',
      });
      expect(result.name).toBe('Updated name');
      expect(result.description).toBe(existed.description);
    });

    it('should update only description', async () => {
      const existed = makeCategory();

      categoryRepositoryMock.findOne.mockResolvedValue(existed);
      categoryRepositoryMock.update.mockResolvedValue({
        ...existed,
        description: 'Updated description',
      });

      const dto: UpdateCategoryDto = {
        description: 'Updated description',
      };

      const result = await service.update(existed.id, dto);

      expect(categoryRepositoryMock.update).toHaveBeenCalledWith(existed.id, {
        description: 'Updated description',
      });
      expect(result.description).toBe('Updated description');
      expect(result.name).toBe(existed.name);
    });

   it('should allow update description without throwing error if user is admin', async () => {
  const existed = makeCategory({ id: 'cat1', authorId: '123' });

  categoryRepositoryMock.findOne.mockResolvedValue(existed);
  categoryRepositoryMock.update.mockResolvedValue({
    ...existed,
    description: 'Updated description',
  });

  const result = await service.update(
    existed.id,
    { description: 'Updated description' },
  );

  expect(categoryRepositoryMock.update).toHaveBeenCalledWith(
    existed.id,
    { description: 'Updated description' },
  );
  expect(result.description).toBe('Updated description');
});

    it('should update description successfully', async () => {
  const existed = makeCategory({ id: 'cat1', authorId: '123' });

  categoryRepositoryMock.findOne.mockResolvedValue(existed);
  categoryRepositoryMock.update.mockResolvedValue({
    ...existed,
    description: 'Updated description',
  });

  const result = await service.update(
    existed.id,
    { description: 'Updated description' },
  );

  expect(categoryRepositoryMock.update).toHaveBeenCalledWith(existed.id, {
    description: 'Updated description',
  });
  expect(result).toEqual({
    ...existed,
    description: 'Updated description',
  });
});
  });

  describe('remove', () => {
    it('should throw NotFoundError when category does not exist', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.remove('missing-id'),
      ).rejects.toThrowError(NotFoundError);

      expect(articleServiceMock.nullifyCategoryByCategoryId).not.toHaveBeenCalled();
      expect(categoryRepositoryMock.remove).not.toHaveBeenCalled();
    });

    it('should nullify category references in articles and remove the category', async () => {
      const category = makeCategory();

      categoryRepositoryMock.findOne.mockResolvedValue(category);
      categoryRepositoryMock.remove.mockResolvedValue(true);

      await service.remove(category.id);

      expect(articleServiceMock.nullifyCategoryByCategoryId).toHaveBeenCalledWith(
        category.id,
      );
      expect(categoryRepositoryMock.remove).toHaveBeenCalledWith(category.id);
    });
  });
});