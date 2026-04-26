import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppLoggerService } from './common/logger/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(AppLoggerService);

  app.useLogger(logger);
  app.useGlobalInterceptors(app.get(LoggingInterceptor));
  app.useGlobalFilters(app.get(GlobalExceptionFilter));
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('REST API for Knowledge Hub platform')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  let isShuttingDown = false;

  const shutdown = async (
    signal: string,
    error?: unknown,
    exitCode = 0,
  ): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    if (error) {
      logger.error(
        {
          signal,
          message:
            error instanceof Error ? error.message : 'Unknown fatal error',
        },
        error instanceof Error ? error.stack : JSON.stringify(error),
        'Bootstrap',
      );
    } else {
      logger.warn(
        {
          signal,
          message: 'Graceful shutdown started',
        },
        'Bootstrap',
      );
    }

    const forceExitTimeout = setTimeout(() => {
      logger.error(
        {
          signal,
          message: 'Forced shutdown after timeout',
        },
        undefined,
        'Bootstrap',
      );
      process.exit(1);
    }, 10000);

    forceExitTimeout.unref();

    try {
      await app.close();

      logger.log(
        {
          signal,
          message: 'Application closed successfully',
        },
        'Bootstrap',
      );

      process.exit(exitCode);
    } catch (closeError) {
      logger.error(
        {
          signal,
          message:
            closeError instanceof Error
              ? closeError.message
              : 'Failed to close application',
        },
        closeError instanceof Error
          ? closeError.stack
          : JSON.stringify(closeError),
        'Bootstrap',
      );

      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT', undefined, 0);
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM', undefined, 0);
  });

  process.on('uncaughtException', (error) => {
    void shutdown('uncaughtException', error, 1);
  });

  process.on('unhandledRejection', (reason) => {
    void shutdown('unhandledRejection', reason, 1);
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);

  logger.log(
    {
      message: `Application is running on port ${port}`,
    },
    'Bootstrap',
  );
}

void bootstrap();
