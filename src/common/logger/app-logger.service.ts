import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileLoggerService } from './file-logger.service';

type AppLogLevel = 'log' | 'debug' | 'warn' | 'error' | 'verbose';

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly context = AppLoggerService.name;
  private readonly environment: string;
  private readonly enabledLevels: Set<AppLogLevel>;

  constructor(
    private readonly configService: ConfigService,
    private readonly fileLoggerService: FileLoggerService,
  ) {
    this.environment = this.configService.get<string>(
      'NODE_ENV',
      'development',
    );

    const configuredLevel = this.configService.get<AppLogLevel>(
      'LOG_LEVEL',
      'log',
    );
    this.enabledLevels = new Set(this.resolveLevels(configuredLevel));
  }

  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }

  private resolveLevels(level: AppLogLevel): AppLogLevel[] {
    const priority: AppLogLevel[] = [
      'error',
      'warn',
      'log',
      'debug',
      'verbose',
    ];
    const index = priority.indexOf(level);

    if (index === -1) {
      return ['error', 'warn', 'log'];
    }

    return priority.slice(0, index + 1);
  }

  private write(
    level: AppLogLevel,
    message: unknown,
    context?: string,
    trace?: string,
  ): void {
    if (!this.enabledLevels.has(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const resolvedContext = context ?? this.context;

    if (this.environment === 'production') {
      const payload = {
        timestamp,
        level,
        context: resolvedContext,
        message,
        ...(trace ? { trace } : {}),
      };

      const line = JSON.stringify(payload);

      this.writeToConsole(level, line);
      this.fileLoggerService.write(line);
      return;
    }

    const printableMessage =
      typeof message === 'string' ? message : JSON.stringify(message);

    const line = `[${timestamp}] [${level.toUpperCase()}] [${resolvedContext}] ${printableMessage}`;

    this.writeToConsole(level, line);

    this.fileLoggerService.write(line);

    if (level === 'error' && trace) {
      this.fileLoggerService.write(trace);
    }
  }

  private writeToConsole(level: AppLogLevel, line: string): void {
    if (level === 'error') {
      console.error(line);
      return;
    }

    if (level === 'warn') {
      console.warn(line);
      return;
    }

    if (level === 'debug') {
      console.debug(line);
      return;
    }

    console.log(line);
  }
}
