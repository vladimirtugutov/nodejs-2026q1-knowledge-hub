import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { CreateCommentDto } from '../../../src/comment/dto/create-comment.dto';

describe('CreateCommentDto', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111';

  const makeDto = (overrides: Partial<CreateCommentDto> = {}) => {
    const dto = new CreateCommentDto();
    dto.content = 'Editor comment';
    dto.articleId = validUuid;
    dto.authorId = validUuid;

    Object.assign(dto, overrides);
    return dto;
  };

  it('should pass validation for a valid payload', async () => {
    const dto = makeDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when content is missing', async () => {
    const dto = makeDto({ content: undefined as unknown as string });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'content')).toBe(true);
  });

  it('should fail when content is not a string', async () => {
    const dto = makeDto();
    (dto as any).content = 123;

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'content')).toBe(true);
  });

  it('should fail when articleId is missing', async () => {
    const dto = makeDto({ articleId: undefined as unknown as string });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'articleId')).toBe(true);
  });

  it('should fail when articleId is not a valid UUID', async () => {
    const dto = makeDto({ articleId: 'not-a-uuid' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'articleId')).toBe(true);
  });

  it('should pass when authorId is undefined', async () => {
    const dto = makeDto({ authorId: undefined as never });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'authorId')).toBe(false);
  });

  it('should pass when authorId is null', async () => {
    const dto = makeDto({ authorId: null });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'authorId')).toBe(false);
  });

  it('should fail when authorId is an invalid UUID', async () => {
    const dto = makeDto({ authorId: 'not-a-uuid' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'authorId')).toBe(true);
  });

  it('should pass when authorId is a valid UUID', async () => {
    const dto = makeDto({ authorId: validUuid });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});