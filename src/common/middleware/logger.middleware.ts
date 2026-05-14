import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';
import { sanitizeForLogging } from '../logger/log-sanitizer.util';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const payload = {
      method: req.method,
      url: req.originalUrl,
      query: sanitizeForLogging(req.query),
      body: sanitizeForLogging(req.body),
    };

    this.logger.log(payload, LoggerMiddleware.name);
    next();
  }
}
