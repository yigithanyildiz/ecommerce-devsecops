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

type EndpointSummary = {
  method: string;
  path: string;
  requestCount: number;
  averageDurationMs: number;
  maxDurationMs: number;
  errorCount: number;
  lastSeenAt: string;
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
    const successCount = samples.filter(
      (sample) => sample.statusCode >= 200 && sample.statusCode < 300,
    ).length;
    const redirectCount = samples.filter(
      (sample) => sample.statusCode >= 300 && sample.statusCode < 400,
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
      successCount,
      redirectCount,
      errorCount,
      clientErrorCount,
      serverErrorRate:
        requestCount === 0
          ? 0
          : Math.round((errorCount / requestCount) * 10000) / 100,
      clientErrorRate:
        requestCount === 0
          ? 0
          : Math.round((clientErrorCount / requestCount) * 10000) / 100,
      averageDurationMs,
      p50DurationMs: this.percentile(samples, 50),
      p95DurationMs: this.percentile(samples, 95),
      maxDurationMs:
        samples.length === 0
          ? 0
          : Math.max(...samples.map((sample) => sample.durationMs)),
      statusBreakdown: {
        success: successCount,
        redirect: redirectCount,
        clientError: clientErrorCount,
        serverError: errorCount,
      },
      slowEndpoints: this.buildEndpointSummaries(samples)
        .sort((first, second) => second.averageDurationMs - first.averageDurationMs)
        .slice(0, 5),
      topErrorEndpoints: this.buildEndpointSummaries(samples)
        .filter((endpoint) => endpoint.errorCount > 0)
        .sort((first, second) => second.errorCount - first.errorCount)
        .slice(0, 5),
      requestsPerMinute: this.buildBuckets(),
      latestRequests,
    };
  }

  private percentile(samples: RequestMetricSample[], percentile: number) {
    if (samples.length === 0) {
      return 0;
    }

    const sortedDurations = samples
      .map((sample) => sample.durationMs)
      .sort((first, second) => first - second);
    const index = Math.min(
      sortedDurations.length - 1,
      Math.ceil((percentile / 100) * sortedDurations.length) - 1,
    );

    return sortedDurations[index];
  }

  private buildEndpointSummaries(samples: RequestMetricSample[]) {
    const endpointMap = new Map<
      string,
      EndpointSummary & { totalDurationMs: number }
    >();

    for (const sample of samples) {
      const key = `${sample.method} ${sample.path}`;
      const current = endpointMap.get(key) ?? {
        method: sample.method,
        path: sample.path,
        requestCount: 0,
        averageDurationMs: 0,
        maxDurationMs: 0,
        errorCount: 0,
        lastSeenAt: new Date(sample.timestamp).toISOString(),
        totalDurationMs: 0,
      };

      current.requestCount += 1;
      current.totalDurationMs += sample.durationMs;
      current.averageDurationMs = Math.round(
        current.totalDurationMs / current.requestCount,
      );
      current.maxDurationMs = Math.max(current.maxDurationMs, sample.durationMs);
      current.errorCount += sample.statusCode >= 500 ? 1 : 0;
      current.lastSeenAt = new Date(
        Math.max(new Date(current.lastSeenAt).getTime(), sample.timestamp),
      ).toISOString();

      endpointMap.set(key, current);
    }

    return Array.from(endpointMap.values()).map(
      ({ totalDurationMs: _totalDurationMs, ...endpoint }) => endpoint,
    );
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
