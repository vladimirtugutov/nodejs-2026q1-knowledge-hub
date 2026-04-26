import { describe, it, expect } from 'vitest';
import { sanitizeForLogging } from '../../../src/common/logger/log-sanitizer.util';

describe('sanitizeForLogging', () => {
  it('leaves primitives unchanged', () => {
    expect(sanitizeForLogging('hello')).toBe('hello');
    expect(sanitizeForLogging(123)).toBe(123);
    expect(sanitizeForLogging(true)).toBe(true);
    expect(sanitizeForLogging(null)).toBe(null);
    expect(sanitizeForLogging(undefined)).toBe(undefined);
  });

  it('sanitizes top-level sensitive keys', () => {
    const input = {
      login: 'tester',
      password: 'secret123',
      refreshToken: 'abc123',
      token: 'jwt.token.here',
      authorization: 'Bearer xxx',
      email: 'test@example.com',
    };

    const result = sanitizeForLogging(input);

    expect(result).toEqual({
      login: 'tester',
      password: '[REDACTED]',
      refreshToken: '[REDACTED]',
      token: '[REDACTED]',
      authorization: '[REDACTED]',
      email: 'test@example.com',
    });
  });

  it('sanitizes nested objects recursively', () => {
    const input = {
      user: {
        id: '1',
        login: 'admin',
        password: 'adminpass',
        profile: {
          name: 'John',
          token: 'user-token',
        },
      },
      tokens: {
        accessToken: 'jwt1',
        refreshToken: 'jwt2',
      },
    };

    const result = sanitizeForLogging(input);

    expect(result).toEqual({
      user: {
        id: '1',
        login: 'admin',
        password: '[REDACTED]',
        profile: {
          name: 'John',
          token: '[REDACTED]',
        },
      },
      tokens: {
        accessToken: '[REDACTED]',
        refreshToken: '[REDACTED]',
      },
    });
  });

  it('sanitizes arrays recursively', () => {
    const input = [
      { password: 'pass1' },
      { token: 'token1' },
      { refreshToken: 'refresh1' },
      { other: 'safe' },
    ];

    const result = sanitizeForLogging(input);

    expect(result).toEqual([
      { password: '[REDACTED]' },
      { token: '[REDACTED]' },
      { refreshToken: '[REDACTED]' },
      { other: 'safe' },
    ]);
  });

  it('sanitizes nested arrays and objects', () => {
    const input = {
      users: [
        { id: '1', password: 'pass1' },
        { id: '2', profile: { password: 'pass2' } },
      ],
      auth: {
        headers: {
          authorization: 'Bearer xxx',
        },
      },
    };

    const result = sanitizeForLogging(input);

    expect(result).toEqual({
      users: [
        { id: '1', password: '[REDACTED]' },
        { id: '2', profile: { password: '[REDACTED]' } },
      ],
      auth: {
        headers: {
          authorization: '[REDACTED]',
        },
      },
    });
  });

  it('handles empty objects and arrays', () => {
    expect(sanitizeForLogging({})).toEqual({});
    expect(sanitizeForLogging([])).toEqual([]);
  });
});