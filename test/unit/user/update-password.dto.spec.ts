import { describe, it, expect } from 'vitest';
import { validateDto } from '../helpers/validation-test.helper';
import { UpdatePasswordDto } from '../../../src/user/dto/update-password.dto';

describe('UpdatePasswordDto', () => {
  it('passes validation with valid payload', async () => {
    const errors = await validateDto(UpdatePasswordDto, {
      oldPassword: 'old-secret-123',
      newPassword: 'new-secret-456',
    });

    expect(errors).toHaveLength(0);
  });

  it('fails when oldPassword is missing', async () => {
    const errors = await validateDto(UpdatePasswordDto, {
      newPassword: 'new-secret-456',
    });

    expect(errors.some((error) => error.property === 'oldPassword')).toBe(true);
  });

  it('fails when newPassword is missing', async () => {
    const errors = await validateDto(UpdatePasswordDto, {
      oldPassword: 'old-secret-123',
    });

    expect(errors.some((error) => error.property === 'newPassword')).toBe(true);
  });

  it('fails when oldPassword is not a string', async () => {
    const errors = await validateDto(UpdatePasswordDto, {
      oldPassword: 123456 as unknown as string,
      newPassword: 'new-secret-456',
    });

    expect(errors.some((error) => error.property === 'oldPassword')).toBe(true);
  });

  it('fails when newPassword is not a string', async () => {
    const errors = await validateDto(UpdatePasswordDto, {
      oldPassword: 'old-secret-123',
      newPassword: 654321 as unknown as string,
    });

    expect(errors.some((error) => error.property === 'newPassword')).toBe(true);
  });
});