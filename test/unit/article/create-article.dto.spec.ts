import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { CreateArticleDto } from '../../../src/article/dto/create-article.dto';
import { ArticleStatus } from '../../../src/common/enums/article-status.enum';

describe('CreateArticleDto', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111';
  const validCategoryUuid = '22222222-2222-4222-8222-222222222222';

  const makeDto = (overrides: Partial<CreateArticleDto> = {}) => {
    const dto = new CreateArticleDto();
    dto.title = 'Valid article title';
    dto.content = 'Valid article content';
    dto.status = ArticleStatus.DRAFT;
    dto.authorId = validUuid;
    dto.categoryId = validCategoryUuid;
    dto.tags = ['nestjs', 'testing'];

    Object.assign(dto, overrides);
    return dto;
  };

  it('should pass validation for a valid payload', async () => {
    const dto = makeDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when title is missing', async () => {
    const dto = makeDto({ title: undefined as unknown as string });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });

  it('should fail when title is empty', async () => {
    const dto = makeDto({ title: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });

  it('should fail when content is missing', async () => {
    const dto = makeDto({ content: undefined as unknown as string });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'content')).toBe(true);
  });

  it('should fail when content is empty', async () => {
    const dto = makeDto({ content: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'content')).toBe(true);
  });

  it('should fail when status has invalid enum value', async () => {
    const dto = makeDto({ status: 'invalid-status' as ArticleStatus });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'status')).toBe(true);
  });

  it('should fail when authorId is not a valid UUID', async () => {
    const dto = makeDto({ authorId: 'not-a-uuid' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'authorId')).toBe(true);
  });

  it('should allow authorId to be null', async () => {
    const dto = makeDto({ authorId: null });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'authorId')).toBe(false);
  });

  it('should fail when categoryId is not a valid UUID', async () => {
    const dto = makeDto({ categoryId: 'not-a-uuid' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'categoryId')).toBe(true);
  });

  it('should allow categoryId to be null', async () => {
    const dto = makeDto({ categoryId: null });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'categoryId')).toBe(false);
  });

  it('should fail when tags is not an array', async () => {
    const dto = makeDto({ tags: 'nestjs' as unknown as string[] });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'tags')).toBe(true);
  });

  it('should fail when tags contains non-string values', async () => {
    const dto = makeDto({ tags: ['nestjs', 123 as unknown as string] });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'tags')).toBe(true);
  });

  it('should pass when tags is omitted', async () => {
    const dto = makeDto({ tags: undefined });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});