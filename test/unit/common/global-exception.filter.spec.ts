import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GlobalExceptionFilter } from '../../../src/common/filters/global-exception.filter';
import { AppLoggerService } from '../../../src/common/logger/app-logger.service';
import { BaseHttpError } from '../../../src/common/errors/base-http.error';

class TestHttpError extends BaseHttpError {
  constructor() {
    super(HttpStatus.CONFLICT, 'Conflict', 'Login already exists');
  }
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  const mockLogger = {
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as AppLoggerService;

  const mockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };

  const mockRequest = {
    method: 'POST',
    url: '/auth/signup',
    originalUrl: '/auth/signup',
    query: {},
    body: {
      login: 'tester',
      password: 'secret123',
      refreshToken: 'some-token',
    },
  };

  const mockHost = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new GlobalExceptionFilter(mockLogger);
  });

  it('handles BaseHttpError with custom status, error and message', () => {
    const exception = new TestHttpError();

    filter.catch(exception, mockHost);

    expect(mockLogger.warn).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CONFLICT,
        error: 'Login already exists',
        message: 'Conflict',
    });
  });

  it('handles HttpException with object response and array message', () => {
    const exception = new BadRequestException({
      message: ['login should not be empty', 'password should not be empty'],
      error: 'Bad Request',
      statusCode: 400,
    });

    filter.catch(exception, mockHost);

    expect(mockLogger.warn).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: 'login should not be empty, password should not be empty',
    });
  });

  it('handles unknown error as internal server error', () => {
    const exception = new Error('Unexpected failure');

    filter.catch(exception, mockHost);

    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });

  it('sanitizes sensitive fields in logged payload', () => {
    const exception = new Error('Unexpected failure');

    filter.catch(exception, mockHost);

    expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
        body: expect.objectContaining({
            password: '[REDACTED]',
            refreshToken: '[REDACTED]',
        }),
        }),
        expect.any(String),
        GlobalExceptionFilter.name,
    );
  });
});