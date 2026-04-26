import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';

import { FileLoggerService } from '../../../src/common/logger/file-logger.service';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  appendFileSync: vi.fn(),
  statSync: vi.fn(),
  renameSync: vi.fn(),
}));

describe('FileLoggerService', () => {
  let service: FileLoggerService;

  const configServiceMock = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    configServiceMock.get.mockImplementation(
      (key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          LOG_MAX_FILE_SIZE: '1024',
        };

        return config[key] ?? defaultValue;
      },
    );

    (fs.existsSync as any).mockReturnValue(true);
    (fs.statSync as any).mockReturnValue({ size: 100 });
    (fs.appendFileSync as any).mockImplementation(() => undefined);
    (fs.mkdirSync as any).mockImplementation(() => undefined);
    (fs.renameSync as any).mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileLoggerService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<FileLoggerService>(FileLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create logs directory if it does not exist', async () => {
    (fs.existsSync as any).mockReturnValueOnce(false).mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileLoggerService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    module.get<FileLoggerService>(FileLoggerService);

    expect(fs.mkdirSync).toHaveBeenCalled();
  });

  it('should not create logs directory if it already exists', () => {
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it('should append line to log file', () => {
    service.write('hello log');

    expect(fs.appendFileSync).toHaveBeenCalledTimes(1);
    expect(fs.appendFileSync.mock.calls[0][1]).toContain('hello log');
  });

  it('should rotate file when size limit is exceeded', async () => {
    (fs.statSync as any).mockReturnValue({ size: 1024 * 1024 * 10 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileLoggerService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    const rotatedService = module.get<FileLoggerService>(FileLoggerService);
    rotatedService.write('line after rotation');

    expect(fs.renameSync).toHaveBeenCalled();
    expect(fs.appendFileSync).toHaveBeenCalled();
  });

  it('should not rotate file if size is below limit', async () => {
  (fs.statSync as any).mockReturnValue({ size: 500 * 1024 }); // 500 KB

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      FileLoggerService,
      {
        provide: ConfigService,
        useValue: configServiceMock,
      },
    ],
  }).compile();

  const service = module.get<FileLoggerService>(FileLoggerService);

  service.write('проверка без ротации');

  expect(fs.renameSync).not.toHaveBeenCalled();
});
});