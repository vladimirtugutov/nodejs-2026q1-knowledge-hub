import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { UpdateArticleDto } from '../../../src/article/dto/update-article.dto';
import { ArticleStatus } from '../../../src/common/enums/article-status.enum';

describe('UpdateArticleDto', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111';

  const makeDto = (overrides: Partial<UpdateArticleDto> = {}) => {
    const dto = new UpdateArticleDto();
    dto.title = 'Updated title';
    dto.content = 'Updated content';
    dto.status = ArticleStatus.PUBLISHED;
    dto.categoryId = validUuid;
    dto.tags = ['nestjs', 'testing'];

    Object.assign(dto, overrides);
    return dto;
  };

  it('should pass validation for a fully filled payload', async () => {
    const dto = makeDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when all fields are undefined (pure empty patch)', async () => {
    const dto = makeDto({
      title: undefined,
      content: undefined,
      status: undefined,
      categoryId: undefined,
      tags: undefined,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when title is undefined', async () => {
    const dto = makeDto({ title: undefined });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when content is undefined', async () => {
    const dto = makeDto({ content: undefined });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when categoryId is undefined', async () => {
    const dto = makeDto({ categoryId: undefined });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when categoryId is null', async () => {
    const dto = makeDto({ categoryId: null });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when categoryId is not a valid UUID', async () => {
    const dto = makeDto({ categoryId: 'not-a-uuid' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'categoryId')).toBe(true);
  });

  it('should pass when categoryId is null and dto is valid', async () => {
    const dto = makeDto({ categoryId: null });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when status is undefined', async () => {
    const dto = makeDto({ status: undefined });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when status has invalid enum value', async () => {
    const dto = makeDto({ status: 'invalid-status' as ArticleStatus });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'status')).toBe(true);
  });

  it('should pass when status is one of allowed enum values', async () => {
    const validStatuses = [
      ArticleStatus.DRAFT,
      ArticleStatus.PUBLISHED,
      ArticleStatus.ARCHIVED,
    ];

    for (const status of validStatuses) {
      const dto = makeDto({ status });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('should pass when tags is undefined', async () => {
    const dto = makeDto({ tags: undefined });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when tags is an empty array', async () => {
    const dto = makeDto({ tags: [] });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when tags is an array of valid strings', async () => {
    const dto = makeDto({ tags: ['nestjs', 'typescript'] });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when tags is not an array', async () => {
    const dto = makeDto();
    (dto as any).tags = 'nestjs';

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'tags')).toBe(true);
  });

  it('should fail when tags contains non-string values', async () => {
    const dto = makeDto();
    (dto as any).tags = ['nestjs', 123];

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'tags')).toBe(true);
  });
});