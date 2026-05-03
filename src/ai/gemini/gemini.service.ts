import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class GeminiService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.model = this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
    this.timeoutMs = Number(this.configService.get<string>('AI_TIMEOUT_MS', '15000'));
  }

  async generateJson<T>(prompt: string): Promise<T> {
    const url = `${this.baseUrl}/models/${this.model}:generateContent`;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        });

        if (response.status === 429 || response.status >= 500) {
          if (attempt < 3) {
            await this.delay(attempt * 1000);
            continue;
          }
        }

        if (!response.ok) {
          const body = await response.text();
          this.logger.error(
            {
              message: 'Gemini request failed',
              statusCode: response.status,
              body,
            },
            undefined,
            GeminiService.name,
          );
          throw new ServiceUnavailableException('AI provider is unavailable');
        }

        const data = await response.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text || typeof text !== 'string') {
          throw new ServiceUnavailableException('AI provider returned empty response');
        }

        return JSON.parse(text) as T;
      } catch (error) {
        if (attempt === 3) {
          this.logger.error(
            {
              message: error instanceof Error ? error.message : 'Gemini request failed',
            },
            error instanceof Error ? error.stack : undefined,
            GeminiService.name,
          );
          throw new ServiceUnavailableException('AI provider is unavailable');
        }

        await this.delay(attempt * 1000);
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new ServiceUnavailableException('AI provider is unavailable');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}