import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';
import { sanitizeForLogging } from '../logger/log-sanitizer.util';
import { BaseHttpError } from '../errors/base-http.error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { statusCode, message, error } = this.resolveException(exception);

    const logPayload = {
      method: req.method,
      url: req.originalUrl ?? req.url,
      query: sanitizeForLogging(req.query),
      body: sanitizeForLogging(req.body),
      statusCode,
      error,
      message,
    };

    const trace =
      exception instanceof Error ? exception.stack : JSON.stringify(exception);

    if (statusCode >= 500) {
      this.logger.error(logPayload, trace, GlobalExceptionFilter.name);
    } else {
      this.logger.warn(logPayload, GlobalExceptionFilter.name);
    }

    res.status(statusCode).json({
      statusCode,
      error,
      message,
    });
  }

  private resolveException(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
  } {
    if (exception instanceof BaseHttpError) {
      return {
        statusCode: exception.statusCode,
        message: exception.message,
        error: exception.error,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          statusCode,
          message: response,
          error: this.getErrorLabel(statusCode),
        };
      }

      if (typeof response === 'object' && response !== null) {
        const responseObject = response as Record<string, unknown>;

        const messageValue = responseObject.message;
        const message = Array.isArray(messageValue)
          ? messageValue.join(', ')
          : typeof messageValue === 'string'
            ? messageValue
            : exception.message;

        const errorValue = responseObject.error;
        const error =
          typeof errorValue === 'string'
            ? errorValue
            : this.getErrorLabel(statusCode);

        return {
          statusCode,
          message,
          error,
        };
      }

      return {
        statusCode,
        message: exception.message,
        error: this.getErrorLabel(statusCode),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    };
  }

  private getErrorLabel(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 409:
        return 'Conflict';
      case 422:
        return 'Unprocessable Entity';
      default:
        return 'Internal Server Error';
    }
  }
}
