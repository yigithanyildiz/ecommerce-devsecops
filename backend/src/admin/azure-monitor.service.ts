import { Injectable } from '@nestjs/common';
import { DefaultAzureCredential } from '@azure/identity';

type MetricName =
  | 'Percentage CPU'
  | 'Available Memory Bytes'
  | 'Available Memory Percentage'
  | 'Network In Total'
  | 'Network Out Total';

type AzureMetricValue = {
  timeStamp?: string;
  average?: number;
  total?: number;
};

type AzureMetricResponse = {
  value?: Array<{
    name?: {
      value?: MetricName;
    };
    timeseries?: Array<{
      data?: AzureMetricValue[];
    }>;
  }>;
};

@Injectable()
export class AzureMonitorService {
  private readonly credential = new DefaultAzureCredential();

  async getVmMetrics() {
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    const resourceGroup = process.env.AZURE_RESOURCE_GROUP;
    const vmName = process.env.AZURE_VM_NAME;

    if (!subscriptionId || !resourceGroup || !vmName) {
      return {
        available: false,
        reason: 'Azure Monitor environment variables are not configured',
      };
    }

    try {
      const token = await this.credential.getToken(
        'https://management.azure.com/.default',
      );
      const resourceId = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${vmName}`;
      const url = new URL(
        `https://management.azure.com${resourceId}/providers/microsoft.insights/metrics`,
      );

      url.searchParams.set('api-version', '2023-10-01');
      url.searchParams.set(
        'metricnames',
        [
          'Percentage CPU',
          'Available Memory Bytes',
          'Available Memory Percentage',
          'Network In Total',
          'Network Out Total',
        ].join(','),
      );
      url.searchParams.set('timespan', 'PT15M');
      url.searchParams.set('interval', 'PT1M');
      url.searchParams.set('aggregation', 'Average,Total');

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      });

      if (!response.ok) {
        return {
          available: false,
          reason: `Azure Monitor request failed with status ${response.status}`,
        };
      }

      return {
        available: true,
        subscriptionId,
        resourceGroup,
        vmName,
        checkedAt: new Date().toISOString(),
        metrics: this.toMetricSummary(
          (await response.json()) as AzureMetricResponse,
        ),
      };
    } catch (error) {
      return {
        available: false,
        reason:
          error instanceof Error
            ? error.message
            : 'Azure Monitor request failed',
      };
    }
  }

  private toMetricSummary(data: AzureMetricResponse) {
    const buildSeries = (name: MetricName, aggregation: 'average' | 'total') => {
      const metric = data.value?.find((item) => item.name?.value === name);
      const points = metric?.timeseries?.flatMap((series) => series.data ?? []);

      return (
        points
          ?.filter((point) => point.timeStamp)
          .map((point) => ({
            timestamp: point.timeStamp as string,
            value: this.round(point[aggregation]),
          }))
          .filter((point) => point.value !== null) ?? []
      );
    };

    const latest = (series: Array<{ value: number | null }>) => {
      return series.at(-1)?.value ?? null;
    };

    const cpuPercentSeries = buildSeries('Percentage CPU', 'average');
    const availableMemoryBytesSeries = buildSeries(
      'Available Memory Bytes',
      'average',
    );
    const availableMemoryPercentSeries = buildSeries(
      'Available Memory Percentage',
      'average',
    );
    const networkInBytesSeries = buildSeries('Network In Total', 'total');
    const networkOutBytesSeries = buildSeries('Network Out Total', 'total');

    return {
      cpuPercent: latest(cpuPercentSeries),
      availableMemoryBytes: latest(availableMemoryBytesSeries),
      availableMemoryPercent: latest(availableMemoryPercentSeries),
      networkInBytes: latest(networkInBytesSeries),
      networkOutBytes: latest(networkOutBytesSeries),
      series: {
        cpuPercent: cpuPercentSeries,
        availableMemoryBytes: availableMemoryBytesSeries,
        availableMemoryPercent: availableMemoryPercentSeries,
        networkInBytes: networkInBytesSeries,
        networkOutBytes: networkOutBytesSeries,
      },
    };
  }

  private round(value: number | undefined) {
    if (value === undefined) {
      return null;
    }

    return Math.round(value * 100) / 100;
  }
}
