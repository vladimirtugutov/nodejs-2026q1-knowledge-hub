import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { SignupDto } from '../../../src/auth/dto/signup.dto';

describe('SignupDto', () => {
  it('fails when login is missing', async () => {
    const dto = new SignupDto();
    dto.password = 'pass';
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'login')).toBe(true);
  });

  it('fails when password is missing', async () => {
    const dto = new SignupDto();
    dto.login = 'test';
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });

  it('passes with valid payload', async () => {
    const dto = new SignupDto();
    dto.login = 'testuser';
    dto.password = 'securepass123';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});