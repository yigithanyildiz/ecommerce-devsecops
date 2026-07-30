import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getRoot() {
    return {
      name: 'ecommerce-devsecops-api',
      status: 'ok',
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  getVersion() {
    return {
      name: 'ecommerce-devsecops-api',
      environment: process.env.NODE_ENV ?? 'development',
      commitSha: process.env.APP_COMMIT_SHA ?? 'local',
      builtAt: process.env.APP_BUILD_TIME ?? 'local',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async getHealthDetails() {
    const startedAt = Date.now();

    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        api: 'ok',
        database: 'ok',
      },
      latencyMs: {
        database: Date.now() - startedAt,
      },
    };
  }
}
