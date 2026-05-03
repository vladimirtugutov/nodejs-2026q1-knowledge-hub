import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileLoggerService {
  private readonly logsDir: string;
  private readonly logFilePath: string;
  private readonly maxFileSizeBytes: number;

  constructor(private readonly configService: ConfigService) {
    this.logsDir = path.resolve(process.cwd(), 'logs');
    this.logFilePath = path.join(this.logsDir, 'app.log');

    const configuredMaxSizeKb = Number(
      this.configService.get<string>('LOG_MAX_FILE_SIZE', '1024'),
    );

    this.maxFileSizeBytes =
      Number.isFinite(configuredMaxSizeKb) && configuredMaxSizeKb > 0
        ? configuredMaxSizeKb * 1024
        : 1024 * 1024;

    this.ensureLogsDirectory();
  }

  write(line: string): void {
    try {
      this.ensureLogsDirectory();
      this.rotateIfNeeded(Buffer.byteLength(`${line}\n`, 'utf8'));
      fs.appendFileSync(this.logFilePath, `${line}\n`, 'utf8');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown file logger error';
      console.error(
        `[${new Date().toISOString()}] [ERROR] [FileLoggerService] Failed to write log file: ${message}`,
      );
    }
  }

  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private rotateIfNeeded(incomingLineSize: number): void {
    if (!fs.existsSync(this.logFilePath)) {
      return;
    }

    const stats = fs.statSync(this.logFilePath);
    const nextSize = stats.size + incomingLineSize;

    if (nextSize < this.maxFileSizeBytes) {
      return;
    }

    const rotatedName = `app-${this.buildTimestamp()}.log`;
    const rotatedPath = path.join(this.logsDir, rotatedName);

    fs.renameSync(this.logFilePath, rotatedPath);
  }

  private buildTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }
}
