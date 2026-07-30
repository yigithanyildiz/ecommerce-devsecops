import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type HealthProbe = {
  timestamp: string;
  api: boolean;
  database: boolean;
  databaseLatencyMs: number | null;
};

const probeLimit = 60;
const probeIntervalMs = 1000;

@Injectable()
export class HealthScoreService implements OnModuleInit, OnModuleDestroy {
  private readonly probes: HealthProbe[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.runProbe();
    this.intervalId = setInterval(() => {
      void this.runProbe();
    }, probeIntervalMs);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getSummary() {
    return {
      windowSeconds: probeLimit,
      api: this.toScore('api'),
      database: this.toScore('database'),
      probes: this.probes,
    };
  }

  private async runProbe() {
    const startedAt = Date.now();
    let database = false;
    let databaseLatencyMs: number | null = null;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = true;
      databaseLatencyMs = Date.now() - startedAt;
    } catch {
      database = false;
    }

    this.probes.push({
      timestamp: new Date().toISOString(),
      api: true,
      database,
      databaseLatencyMs,
    });

    if (this.probes.length > probeLimit) {
      this.probes.splice(0, this.probes.length - probeLimit);
    }
  }

  private toScore(key: 'api' | 'database') {
    if (this.probes.length === 0) {
      return {
        scorePercent: 0,
        successfulChecks: 0,
        totalChecks: 0,
      };
    }

    const successfulChecks = this.probes.filter((probe) => probe[key]).length;

    return {
      scorePercent: Math.round((successfulChecks / this.probes.length) * 100),
      successfulChecks,
      totalChecks: this.probes.length,
    };
  }
}
