import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { UpdateCategoryDto } from '../../../src/category/dto/update-category.dto';

describe('UpdateCategoryDto', () => {
  const makeDto = (overrides: Partial<UpdateCategoryDto> = {}) => {
    const dto = new UpdateCategoryDto();
    dto.name = 'UPDATED_CATEGORY';
    dto.description = 'Updated category description';

    Object.assign(dto, overrides);
    return dto;
  };

  it('should pass validation for a valid payload', async () => {
    const dto = makeDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass validation when both fields are omitted', async () => {
    const dto = new UpdateCategoryDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when only name is provided', async () => {
    const dto = new UpdateCategoryDto();
    dto.name = 'ONLY_NAME';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when only description is provided', async () => {
    const dto = new UpdateCategoryDto();
    dto.description = 'Only description';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when name is not a string', async () => {
    const dto = makeDto();
    (dto as any).name = 123;

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('should fail when description is not a string', async () => {
    const dto = makeDto();
    (dto as any).description = 123;

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'description')).toBe(true);
  });

  it('should pass when name is undefined', async () => {
    const dto = makeDto({ name: undefined });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(false);
  });

  it('should pass when description is undefined', async () => {
    const dto = makeDto({ description: undefined });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'description')).toBe(false);
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