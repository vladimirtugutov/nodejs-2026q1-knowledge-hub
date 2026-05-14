import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLoggerService } from '../../../src/common/logger/app-logger.service';
import { FileLoggerService } from '../../../src/common/logger/file-logger.service';

describe('AppLoggerService', () => {
  let service: AppLoggerService;

  const configServiceMock = {
    get: vi.fn(),
  };

  const fileLoggerServiceMock = {
    write: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    configServiceMock.get.mockImplementation(
      (key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          NODE_ENV: 'development',
          LOG_LEVEL: 'verbose',
        };

        return config[key] ?? defaultValue;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLoggerService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: FileLoggerService,
          useValue: fileLoggerServiceMock,
        },
      ],
    }).compile();

    service = module.get<AppLoggerService>(AppLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should write log message to console.log and file in development', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    service.log('test log', 'TestContext');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(fileLoggerServiceMock.write).toHaveBeenCalledTimes(1);

    const line = String(consoleSpy.mock.calls[0][0]);
    expect(line).toContain('[LOG]');
    expect(line).toContain('[TestContext]');
    expect(line).toContain('test log');

    consoleSpy.mockRestore();
  });

  it('should write warn message to console.warn and file', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    service.warn('warn message', 'WarnContext');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(fileLoggerServiceMock.write).toHaveBeenCalledTimes(1);

    const line = String(consoleSpy.mock.calls[0][0]);
    expect(line).toContain('[WARN]');
    expect(line).toContain('[WarnContext]');
    expect(line).toContain('warn message');

    consoleSpy.mockRestore();
  });

  it('should write debug message to console.debug and file', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    service.debug('debug message', 'DebugContext');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(fileLoggerServiceMock.write).toHaveBeenCalledTimes(1);

    const line = String(consoleSpy.mock.calls[0][0]);
    expect(line).toContain('[DEBUG]');
    expect(line).toContain('[DebugContext]');
    expect(line).toContain('debug message');

    consoleSpy.mockRestore();
  });

  it('should write verbose message to console.log and file', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    service.verbose('verbose message', 'VerboseContext');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(fileLoggerServiceMock.write).toHaveBeenCalledTimes(1);

    const line = String(consoleSpy.mock.calls[0][0]);
    expect(line).toContain('[VERBOSE]');
    expect(line).toContain('[VerboseContext]');
    expect(line).toContain('verbose message');

    consoleSpy.mockRestore();
  });

  it('should write error message and trace to file', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    service.error('error message', 'stack trace', 'ErrorContext');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(fileLoggerServiceMock.write).toHaveBeenCalledTimes(2);

    const line = String(consoleSpy.mock.calls[0][0]);
    expect(line).toContain('[ERROR]');
    expect(line).toContain('[ErrorContext]');
    expect(line).toContain('error message');

    expect(fileLoggerServiceMock.write).toHaveBeenNthCalledWith(2, 'stack trace');

    consoleSpy.mockRestore();
  });

  it('should use default context when no context is provided', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    service.log('message without context');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(String(consoleSpy.mock.calls[0][0])).toContain('[AppLoggerService]');

    consoleSpy.mockRestore();
  });

  it('should stringify object message in development mode', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    service.log({ foo: 'bar' }, 'ObjectContext');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(String(consoleSpy.mock.calls[0][0])).toContain('{"foo":"bar"}');

    consoleSpy.mockRestore();
  });

  it('should skip disabled levels', async () => {
    configServiceMock.get.mockImplementation(
      (key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          NODE_ENV: 'development',
          LOG_LEVEL: 'warn',
        };

        return config[key] ?? defaultValue;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLoggerService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: FileLoggerService,
          useValue: fileLoggerServiceMock,
        },
      ],
    }).compile();

    const restrictedService = module.get<AppLoggerService>(AppLoggerService);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    restrictedService.log('hidden log');
    restrictedService.debug('hidden debug');

    expect(logSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
    expect(fileLoggerServiceMock.write).not.toHaveBeenCalled();

    logSpy.mockRestore();
    debugSpy.mockRestore();
  });

  it('should write JSON payload in production mode', async () => {
    configServiceMock.get.mockImplementation(
      (key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          NODE_ENV: 'production',
          LOG_LEVEL: 'verbose',
        };

        return config[key] ?? defaultValue;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLoggerService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: FileLoggerService,
          useValue: fileLoggerServiceMock,
        },
      ],
    }).compile();

    const prodService = module.get<AppLoggerService>(AppLoggerService);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    prodService.log({ event: 'prod-log' }, 'ProdContext');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(fileLoggerServiceMock.write).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(String(consoleSpy.mock.calls[0][0]));
    expect(payload.level).toBe('log');
    expect(payload.context).toBe('ProdContext');
    expect(payload.message).toEqual({ event: 'prod-log' });
    expect(payload).toHaveProperty('timestamp');

    consoleSpy.mockRestore();
  });
});