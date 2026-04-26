import { describe, it, expect } from 'vitest';
import { validateDto } from '../helpers/validation-test.helper';
import { CreateUserDto } from '../../../src/user/dto/create-user.dto';
import { UserRole } from '../../../src/common/enums/user-role.enum';

describe('CreateUserDto', () => {
  it('passes validation with valid payload and explicit role', async () => {
    const errors = await validateDto(CreateUserDto, {
      login: 'john_doe',
      password: 'strong-password-123',
      role: UserRole.VIEWER,
    });

    expect(errors).toHaveLength(0);
  });

  it('passes validation with valid payload without role', async () => {
    const errors = await validateDto(CreateUserDto, {
      login: 'john_doe',
      password: 'strong-password-123',
    });

    expect(errors).toHaveLength(0);
  });

  it('fails when login is missing', async () => {
    const errors = await validateDto(CreateUserDto, {
      password: 'strong-password-123',
      role: UserRole.VIEWER,
    });

    expect(errors.some((error) => error.property === 'login')).toBe(true);
  });

  it('fails when password is missing', async () => {
    const errors = await validateDto(CreateUserDto, {
      login: 'john_doe',
      role: UserRole.VIEWER,
    });

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });

  it('fails when role is invalid', async () => {
    const errors = await validateDto(CreateUserDto, {
      login: 'john_doe',
      password: 'strong-password-123',
      role: 'superadmin' as UserRole,
    });

    expect(errors.some((error) => error.property === 'role')).toBe(true);
  });

  it('fails when login is not a string', async () => {
    const errors = await validateDto(CreateUserDto, {
      login: 123 as unknown as string,
      password: 'strong-password-123',
      role: UserRole.VIEWER,
    });

    expect(errors.some((error) => error.property === 'login')).toBe(true);
  });

  it('fails when password is not a string', async () => {
    const errors = await validateDto(CreateUserDto, {
      login: 'john_doe',
      password: 123456 as unknown as string,
      role: UserRole.VIEWER,
    });

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });
});