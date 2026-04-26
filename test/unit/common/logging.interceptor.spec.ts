import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { LoggingInterceptor } from '../../../src/common/interceptors/logging.interceptor';

describe('LoggingInterceptor', () => {
  const mockLogger = {
    log: vi.fn(),
  };

  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    vi.clearAllMocks();
    interceptor = new LoggingInterceptor(mockLogger as any);
  });

  it('logs method, url, statusCode and responseTimeMs on successful response', async () => {
    const mockRequest = {
      method: 'GET',
      originalUrl: '/user',
      url: '/user',
    };

    const mockResponse = {
      statusCode: 200,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    await firstValueFrom(interceptor.intercept(mockContext, next));

    expect(mockLogger.log).toHaveBeenCalledTimes(1);

    const [payload, contextName] = mockLogger.log.mock.calls[0];

    expect(contextName).toBe(LoggingInterceptor.name);
    expect(payload).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: '/user',
        statusCode: 200,
        responseTimeMs: expect.any(Number),
      }),
    );
  });

  it('uses req.url when originalUrl is missing', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/auth/login',
    };

    const mockResponse = {
      statusCode: 201,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const next: CallHandler = {
      handle: () => of({ accessToken: 'token' }),
    };

    await firstValueFrom(interceptor.intercept(mockContext, next));

    const [payload] = mockLogger.log.mock.calls[0];

    expect(payload).toEqual(
      expect.objectContaining({
        method: 'POST',
        url: '/auth/login',
        statusCode: 201,
        responseTimeMs: expect.any(Number),
      }),
    );
  });
});