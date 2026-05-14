import { ApiProperty } from '@nestjs/swagger';

export class UsageResponseDto {
  @ApiProperty()
  totalRequests: number;

  @ApiProperty({
    example: {
      summarize: 2,
      translate: 1,
      analyze: 3,
      generate: 4,
    },
  })
  requestsByEndpoint: Record<string, number>;

  @ApiProperty({
    example: {
      totalLatencyMs: 4200,
      averageLatencyMs: 1050,
      cacheHits: 3,
      cacheMisses: 2,
      cacheHitRatio: 0.6,
    },
  })
  diagnostics: {
    totalLatencyMs: number;
    averageLatencyMs: number;
    cacheHits: number;
    cacheMisses: number;
    cacheHitRatio: number;
  };
}
