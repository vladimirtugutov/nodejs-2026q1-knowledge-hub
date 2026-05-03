import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ParseUuidPipe } from '../../../src/common/pipes/parse-uuid.pipe';

describe('ParseUuidPipe', () => {
  let pipe: ParseUuidPipe;

  beforeEach(() => {
    pipe = new ParseUuidPipe();
  });

  it('should pass through a valid UUID v4', () => {
    const value = '550e8400-e29b-41d4-a716-446655440000';

    const result = pipe.transform(value, {
      type: 'param',
      metatype: String,
      data: 'id',
    });

    expect(result).toBe(value);
  });

  it('should throw BadRequestException for an invalid UUID', () => {
    expect(() =>
      pipe.transform('not-a-uuid', {
        type: 'param',
        metatype: String,
        data: 'id',
      }),
    ).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for malformed UUID', () => {
    expect(() =>
      pipe.transform('550e8400-e29b-41d4-a716', {
        type: 'param',
        metatype: String,
        data: 'id',
      }),
    ).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for empty string', () => {
    expect(() =>
      pipe.transform('', {
        type: 'param',
        metatype: String,
        data: 'id',
      }),
    ).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for non-string value', () => {
    expect(() =>
      pipe.transform(123 as unknown as string, {
        type: 'param',
        metatype: String,
        data: 'id',
      }),
    ).toThrow(BadRequestException);
  });
});