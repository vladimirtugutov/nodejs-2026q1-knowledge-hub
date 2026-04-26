import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

type PlainObject = Record<string, unknown>;

@Injectable()
export class PasswordStripInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => this.stripPassword(data)));
  }

  private stripPassword(data: unknown): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.stripPassword(item));
    }

    if (data && typeof data === 'object') {
      const obj = data as PlainObject;

      if ('password' in obj) {
        const { password: _password, ...rest } = obj;
        return rest;
      }

      return obj;
    }

    return data;
  }
}