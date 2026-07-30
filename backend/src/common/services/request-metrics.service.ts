import { Injectable } from '@nestjs/common';

type RequestMetricSample = {
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
};

type Bucket = {
  timestamp: string;
  requestCount: number;
  errorCount: number;
  averageDurationMs: number;
};

const retentionMs = 15 * 60 * 1000;
const bucketMs = 60 * 1000;

@Injectable()
export class RequestMetricsService {
  private static readonly samples: RequestMetricSample[] = [];

  record(sample: Omit<RequestMetricSample, 'timestamp'>) {
    RequestMetricsService.samples.push({
      ...sample,
      timestamp: Date.now(),
    });

    this.prune();
  }

  getSummary() {
    this.prune();

    const samples = RequestMetricsService.samples;
    const requestCount = samples.length;
    const errorCount = samples.filter((sample) => sample.statusCode >= 500).length;
    const clientErrorCount = samples.filter(
      (sample) => sample.statusCode >= 400 && sample.statusCode < 500,
    ).length;
    const totalDuration = samples.reduce(
      (total, sample) => total + sample.durationMs,
      0,
    );
    const averageDurationMs =
      requestCount === 0 ? 0 : Math.round(totalDuration / requestCount);
    const latestRequests = samples.slice(-8).reverse();

    return {
      windowMinutes: 15,
      requestCount,
      errorCount,
      clientErrorCount,
      averageDurationMs,
      requestsPerMinute: this.buildBuckets(),
      latestRequests,
    };
  }

  private buildBuckets() {
    const now = Date.now();
    const buckets: Bucket[] = Array.from({ length: 15 }, (_, index) => {
      const bucketStart = now - (14 - index) * bucketMs;

      return {
        timestamp: new Date(bucketStart).toISOString(),
        requestCount: 0,
        errorCount: 0,
        averageDurationMs: 0,
      };
    });

    const durationTotals = new Map<number, number>();

    for (const sample of RequestMetricsService.samples) {
      const age = now - sample.timestamp;
      const bucketIndex = 14 - Math.floor(age / bucketMs);

      if (bucketIndex < 0 || bucketIndex >= buckets.length) {
        continue;
      }

      buckets[bucketIndex].requestCount += 1;

      if (sample.statusCode >= 500) {
        buckets[bucketIndex].errorCount += 1;
      }

      durationTotals.set(
        bucketIndex,
        (durationTotals.get(bucketIndex) ?? 0) + sample.durationMs,
      );
    }

    return buckets.map((bucket, index) => ({
      ...bucket,
      averageDurationMs:
        bucket.requestCount === 0
          ? 0
          : Math.round((durationTotals.get(index) ?? 0) / bucket.requestCount),
    }));
  }

  private prune() {
    const minTimestamp = Date.now() - retentionMs;
    const firstValidIndex = RequestMetricsService.samples.findIndex(
      (sample) => sample.timestamp >= minTimestamp,
    );

    if (firstValidIndex > 0) {
      RequestMetricsService.samples.splice(0, firstValidIndex);
    }
  }
}
