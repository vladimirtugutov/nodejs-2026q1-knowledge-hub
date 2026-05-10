import { Injectable } from '@nestjs/common';

@Injectable()
export class AiUsageService {
  private totalRequests = 0;
  private totalLatencyMs = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private readonly requestsByEndpoint = new Map<string, number>();

  track(endpoint: string, latencyMs?: number): void {
    this.totalRequests += 1;
    this.requestsByEndpoint.set(
      endpoint,
      (this.requestsByEndpoint.get(endpoint) ?? 0) + 1,
    );

    if (typeof latencyMs === 'number' && Number.isFinite(latencyMs)) {
      this.totalLatencyMs += latencyMs;
    }
  }

  trackCacheHit(): void {
    this.cacheHits += 1;
  }

  trackCacheMiss(): void {
    this.cacheMisses += 1;
  }

  getStats() {
    const totalCacheChecks = this.cacheHits + this.cacheMisses;

    return {
      totalRequests: this.totalRequests,
      requestsByEndpoint: Object.fromEntries(this.requestsByEndpoint),
      diagnostics: {
        totalLatencyMs: this.totalLatencyMs,
        averageLatencyMs:
          this.totalRequests > 0
            ? Math.round(this.totalLatencyMs / this.totalRequests)
            : 0,
        cacheHits: this.cacheHits,
        cacheMisses: this.cacheMisses,
        cacheHitRatio:
          totalCacheChecks > 0 ? this.cacheHits / totalCacheChecks : 0,
      },
    };
  }
}
