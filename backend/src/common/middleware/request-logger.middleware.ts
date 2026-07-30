import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { RequestMetricsService } from '../services/request-metrics.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  constructor(private readonly requestMetricsService: RequestMetricsService) {}

  use(request: Request, response: Response, next: NextFunction) {
    if (request.originalUrl.startsWith('/health')) {
      next();
      return;
    }

    const startedAt = Date.now();
    const requestId =
      request.header('x-request-id') ||
      request.header('x-correlation-id') ||
      randomUUID();

    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const path = request.originalUrl;

      this.requestMetricsService.record({
        method: request.method,
        path,
        statusCode: response.statusCode,
        durationMs,
      });

      this.logger.log(
        JSON.stringify({
          requestId,
          method: request.method,
          path,
          statusCode: response.statusCode,
          durationMs,
          userAgent: request.header('user-agent') ?? null,
        }),
      );
    });

    next();
  }
}
