import { Injectable } from '@nestjs/common';
import { DefaultAzureCredential } from '@azure/identity';

type MetricName =
  | 'Percentage CPU'
  | 'Available Memory Bytes'
  | 'Available Memory Percentage'
  | 'Network In Total'
  | 'Network Out Total';

type AzureMetricValue = {
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
    const findMetric = (name: MetricName) => {
      const metric = data.value?.find((item) => item.name?.value === name);
      const points = metric?.timeseries?.flatMap((series) => series.data ?? []);

      return points
        ?.slice()
        .reverse()
        .find((point) => point.average !== undefined || point.total !== undefined);
    };

    return {
      cpuPercent: this.round(findMetric('Percentage CPU')?.average),
      availableMemoryBytes: this.round(
        findMetric('Available Memory Bytes')?.average,
      ),
      availableMemoryPercent: this.round(
        findMetric('Available Memory Percentage')?.average,
      ),
      networkInBytes: this.round(findMetric('Network In Total')?.total),
      networkOutBytes: this.round(findMetric('Network Out Total')?.total),
    };
  }

  private round(value: number | undefined) {
    if (value === undefined) {
      return null;
    }

    return Math.round(value * 100) / 100;
  }
}
