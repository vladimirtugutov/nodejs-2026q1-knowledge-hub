import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly embeddingModel: string;
  private readonly timeoutMs: number;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.model = this.configService.get<string>(
      'GEMINI_MODEL',
      'gemini-2.0-flash',
    );
    this.embeddingModel = this.configService.get<string>(
      'GEMINI_EMBEDDING_MODEL',
      'text-embedding-004',
    );
    this.timeoutMs = Number(
      this.configService.get<string>('AI_TIMEOUT_MS', '15000'),
    );
    this.baseUrl = this.configService.get<string>(
      'GEMINI_API_BASE_URL',
      'https://generativelanguage.googleapis.com/v1beta',
    );
  }

  async generateJson<T>(prompt: string, responseSchema?: object): Promise<T> {
    const data = await this.requestWithRetry(
      this.buildModelUrl(this.model, 'generateContent'),
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          ...(responseSchema ? { responseSchema } : {}),
        },
      },
    );

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== 'string') {
      throw new ServiceUnavailableException(
        'AI provider returned empty response',
      );
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ServiceUnavailableException(
        'AI provider returned invalid JSON',
      );
    }
  }

  async generateText(prompt: string): Promise<string> {
    const data = await this.requestWithRetry(
      this.buildModelUrl(this.model, 'generateContent'),
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      },
    );

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim();

    if (!text) {
      throw new ServiceUnavailableException(
        'AI provider returned empty response',
      );
    }

    return text;
  }

  async embedText(text: string): Promise<number[]> {
    const modelName = this.normalizeModelName(this.embeddingModel);

    const data = await this.requestWithRetry(
      this.buildModelUrl(modelName, 'embedContent'),
      {
        model: `models/${modelName}`,
        content: {
          parts: [{ text }],
        },
      },
    );

    const values = data?.embedding?.values;

    if (!Array.isArray(values)) {
      throw new ServiceUnavailableException(
        'AI provider returned invalid embedding',
      );
    }

    return values;
  }

  private buildModelUrl(model: string, action: string): string {
    const normalizedModel = this.normalizeModelName(model);
    return `${this.baseUrl}/models/${normalizedModel}:${action}`;
  }

  private normalizeModelName(model: string): string {
    return model.startsWith('models/') ? model.slice('models/'.length) : model;
  }

  private async requestWithRetry(url: string, body: object): Promise<any> {
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
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (response.status === 429 || response.status >= 500) {
          if (attempt < 3) {
            await this.delay(attempt * 1000);
            continue;
          }

          throw new ServiceUnavailableException('AI provider is unavailable');
        }

        if (!response.ok) {
          const bodyText = await response.text();

          console.error({
            message: 'Gemini request failed',
            statusCode: response.status,
            body: bodyText,
          });

          if (response.status === 401 || response.status === 403) {
            throw new InternalServerErrorException(
              'AI provider credentials are invalid',
            );
          }

          throw new ServiceUnavailableException('AI provider is unavailable');
        }

        return await response.json();
      } catch (error) {
        if (
          error instanceof ServiceUnavailableException ||
          error instanceof InternalServerErrorException
        ) {
          throw error;
        }

        if (attempt === 3) {
          console.error(error);
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
