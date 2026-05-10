import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from '../../common/errors/validation.error';
import { ForbiddenError } from '../../common/errors/forbidden.error';

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class AiRateLimitService {
  private readonly buckets = new Map<string, Bucket>();
  private readonly limitPerMinute: number;

  constructor(private readonly configService: ConfigService) {
    this.limitPerMinute = Number(
      this.configService.get<string>('AI_RATE_LIMIT_RPM', '20'),
    );
  }

  check(key: string): number | null {
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || now >= current.resetAt) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + 60_000,
      });
      return null;
    }

    if (current.count >= this.limitPerMinute) {
      return Math.ceil((current.resetAt - now) / 1000);
    }

    current.count += 1;
    this.buckets.set(key, current);
    return null;
  }
}
