import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { CreateCategoryDto } from '../../../src/category/dto/create-category.dto';

describe('CreateCategoryDto', () => {
  const makeDto = (overrides: Partial<CreateCategoryDto> = {}) => {
    const dto = new CreateCategoryDto();
    dto.name = 'TEST_CATEGORY';
    dto.description = 'Test category description';

    Object.assign(dto, overrides);
    return dto;
  };

  it('should pass validation for a valid payload', async () => {
    const dto = makeDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when name is missing', async () => {
    const dto = makeDto({ name: undefined as unknown as string });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('should fail when name is not a string', async () => {
    const dto = makeDto();
    (dto as any).name = 123;

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('should fail when description is missing', async () => {
    const dto = makeDto({ description: undefined as unknown as string });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'description')).toBe(true);
  });

  it('should fail when description is not a string', async () => {
    const dto = makeDto();
    (dto as any).description = 123;

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'description')).toBe(true);
  });

  it('should pass when name is an empty string', async () => {
    const dto = makeDto({ name: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(false);
  });

  it('should pass when description is an empty string', async () => {
    const dto = makeDto({ description: '' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'description')).toBe(false);
  });
});