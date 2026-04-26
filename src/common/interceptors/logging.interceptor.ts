import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const startedAt = Date.now();
    const method = req.method;
    const url = req.originalUrl ?? req.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startedAt;

          this.logger.log(
            {
              method,
              url,
              statusCode: res.statusCode,
              responseTimeMs: duration,
            },
            LoggingInterceptor.name,
          );
        },
        error: (error: unknown) => {
          const duration = Date.now() - startedAt;

          this.logger.error(
            {
              method,
              url,
              statusCode: res.statusCode,
              responseTimeMs: duration,
              error:
                error instanceof Error ? error.message : 'Unknown error',
            },
            error instanceof Error ? error.stack : undefined,
            LoggingInterceptor.name,
          );
        },
      }),
    );
  }
}