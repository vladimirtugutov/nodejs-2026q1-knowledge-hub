import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { RefreshDto } from '../../../src/auth/dto/refresh.dto';

describe('RefreshDto', () => {
  it('passes when refreshToken is optional and not provided', async () => {
    const dto = new RefreshDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes when refreshToken is valid string', async () => {
    const dto = new RefreshDto();
    dto.refreshToken = 'valid-refresh-token';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when refreshToken is not a string', async () => {
    const dto = new RefreshDto();
    dto.refreshToken = 123 as any;
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'refreshToken')).toBe(true);
  });
});