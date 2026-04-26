import { describe, it, expect, beforeEach } from 'vitest';
import { of, lastValueFrom } from 'rxjs';
import { PasswordStripInterceptor } from '../../../src/common/interceptors/password-strip.interceptor';

describe('PasswordStripInterceptor', () => {
  let interceptor: PasswordStripInterceptor;

  beforeEach(() => {
    interceptor = new PasswordStripInterceptor();
  });

  it('should remove password field from a single object response', async () => {
    const data = {
      id: '1',
      login: 'john',
      password: 'secret',
      role: 'admin',
    };

    const context = {} as any;
    const next = {
      handle: () => of(data),
    };

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      id: '1',
      login: 'john',
      role: 'admin',
    });
    expect((result as any).password).toBeUndefined();
  });

  it('should remove password field from each object in array response', async () => {
    const data = [
      {
        id: '1',
        login: 'john',
        password: 'secret1',
        role: 'admin',
      },
      {
        id: '2',
        login: 'kate',
        password: 'secret2',
        role: 'editor',
      },
    ];

    const context = {} as any;
    const next = {
      handle: () => of(data),
    };

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual([
      {
        id: '1',
        login: 'john',
        role: 'admin',
      },
      {
        id: '2',
        login: 'kate',
        role: 'editor',
      },
    ]);
  });

  it('should keep object unchanged when password field is absent', async () => {
    const data = {
      id: '1',
      login: 'john',
      role: 'admin',
    };

    const context = {} as any;
    const next = {
      handle: () => of(data),
    };

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual(data);
  });

  it('should keep primitive response unchanged', async () => {
    const context = {} as any;
    const next = {
      handle: () => of('ok'),
    };

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('ok');
  });
});