import { useEffect, useState } from "react";
import {
  Activity,
  Clock3,
  Cpu,
  Database,
  Files,
  HardDrive,
  LineChart,
  RefreshCw,
  Server,
  Timer,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "../api/client";
import { getApiErrorMessage } from "../api/errors";
import { StatCard } from "../components/StatCard";

type SystemMetrics = {
  checkedAt: string;
  overallStatus: {
    level: "healthy" | "degraded" | "critical";
    label: string;
    reason: string;
  };
  api: {
    name: string;
    environment: string;
    commitSha: string;
    builtAt: string;
    uptimeSeconds: number;
    health: {
      status: string;
      timestamp: string;
      checks: {
        api: string;
        database: string;
      };
      latencyMs: {
        database: number | null;
      };
      error?: string;
    };
    requestMetrics: {
      windowMinutes: number;
      requestCount: number;
      successCount: number;
      redirectCount: number;
      errorCount: number;
      clientErrorCount: number;
      serverErrorRate: number;
      clientErrorRate: number;
      averageDurationMs: number;
      p50DurationMs: number;
      p95DurationMs: number;
      maxDurationMs: number;
      statusBreakdown: {
        success: number;
        redirect: number;
        clientError: number;
        serverError: number;
      };
      slowEndpoints: EndpointSummary[];
      topErrorEndpoints: EndpointSummary[];
      requestsPerMinute: Array<{
        timestamp: string;
        requestCount: number;
        errorCount: number;
        averageDurationMs: number;
      }>;
      latestRequests: Array<{
        timestamp: number;
        method: string;
        path: string;
        statusCode: number;
        durationMs: number;
      }>;
    };
    healthScore: {
      windowSeconds: number;
      api: HealthScore;
      database: HealthScore;
      probes: Array<{
        timestamp: string;
        api: boolean;
        database: boolean;
        databaseLatencyMs: number | null;
      }>;
    };
  };
  azure:
    | {
        available: true;
        subscriptionId: string;
        resourceGroup: string;
        vmName: string;
        checkedAt: string;
        metrics: {
          cpuPercent: number | null;
          availableMemoryBytes: number | null;
          availableMemoryPercent: number | null;
          networkInBytes: number | null;
          networkOutBytes: number | null;
          diskReadBytes: number | null;
          diskWriteBytes: number | null;
          diskReadOperationsPerSecond: number | null;
          diskWriteOperationsPerSecond: number | null;
          series: {
            cpuPercent: MetricPoint[];
            availableMemoryBytes: MetricPoint[];
            availableMemoryPercent: MetricPoint[];
            networkInBytes: MetricPoint[];
            networkOutBytes: MetricPoint[];
            diskReadBytes: MetricPoint[];
            diskWriteBytes: MetricPoint[];
            diskReadOperationsPerSecond: MetricPoint[];
            diskWriteOperationsPerSecond: MetricPoint[];
          };
        };
      }
    | {
        available: false;
        reason: string;
      };
  backups:
    | {
        available: true;
        backupDir: string;
        retentionDays: number | null;
        freshnessStatus: "healthy" | "warning" | "critical";
        latestBackupAgeHours: number | null;
        backupCount: number;
        totalSizeBytes: number;
        latestBackup: BackupFile | null;
        recentBackups: BackupFile[];
      }
    | {
        available: false;
        backupDir: string;
        reason: string;
      };
};

type MetricPoint = {
  timestamp: string;
  value: number | null;
};

type BackupFile = {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
};

type HealthScore = {
  scorePercent: number;
  successfulChecks: number;
  totalChecks: number;
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

function formatDate(value: string) {
  if (value === "local" || value === "unknown") {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatRelativeAge(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "unknown";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  const minutes = Math.floor(diffSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  }

  if (hours > 0) {
    return `${hours}h ago`;
  }

  if (minutes > 0) {
    return `${minutes}m ago`;
  }

  return "just now";
}

function formatPercent(value: number | null) {
  return value === null ? "N/A" : `${value.toFixed(1)}%`;
}

function formatBytes(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function shortSha(value: string) {
  return value === "local" || value === "unknown" ? value : value.slice(0, 8);
}

function toNumberSeries(points: MetricPoint[]) {
  return points
    .map((point) => point.value)
    .filter((value): value is number => value !== null);
}

export function SystemPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadMetrics() {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get<SystemMetrics>("/admin/system/metrics");
      setMetrics(response.data);
    } catch (error) {
      setError(getApiErrorMessage(error, "System metrics could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();

    const intervalId = window.setInterval(loadMetrics, 10_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const azureMetrics = metrics?.azure.available
    ? metrics.azure.metrics
    : null;
  const latestBackup = metrics?.backups.available
    ? metrics.backups.latestBackup
    : null;

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-[#444748]">
            OPERATIONS
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#1c1b1b]">
            System Monitoring
          </h1>
          <p className="mt-2 text-sm text-[#444748]">
            API health, deployment metadata, and Azure VM runtime metrics.
            Updates every 10 seconds.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1c1b1b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#343232] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {isLoading && !metrics && (
        <div className="rounded-2xl bg-white p-6 text-sm font-medium text-[#444748]">
          Loading system metrics...
        </div>
      )}

      {metrics && (
        <div className="space-y-6">
          <section
            className={[
              "border p-5",
              metrics.overallStatus.level === "healthy"
                ? "border-emerald-200 bg-emerald-50"
                : metrics.overallStatus.level === "degraded"
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50",
            ].join(" ")}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#444748]">
                  Overall System Status
                </p>
                <h2
                  className={[
                    "mt-1 text-2xl font-bold",
                    metrics.overallStatus.level === "healthy"
                      ? "text-emerald-800"
                      : metrics.overallStatus.level === "degraded"
                        ? "text-amber-800"
                        : "text-red-800",
                  ].join(" ")}
                >
                  {metrics.overallStatus.label}
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#444748]">
                  {metrics.overallStatus.reason}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm font-bold sm:grid-cols-4">
                <StatusPill
                  label="API"
                  value={`${metrics.api.healthScore.api.scorePercent}%`}
                />
                <StatusPill
                  label="DB"
                  value={`${metrics.api.healthScore.database.scorePercent}%`}
                />
                <StatusPill
                  label="5xx"
                  value={`${metrics.api.requestMetrics.serverErrorRate}%`}
                />
                <StatusPill
                  label="Backup"
                  value={
                    metrics.backups.available
                      ? metrics.backups.freshnessStatus
                      : "critical"
                  }
                />
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="API Status"
              value={metrics.api.health.status.toUpperCase()}
              icon={Activity}
              helper={metrics.api.name}
            />
            <StatCard
              title="Database"
              value={metrics.api.health.checks.database.toUpperCase()}
              icon={Database}
              helper={
                metrics.api.health.latencyMs.database === null
                  ? "N/A latency"
                  : `${metrics.api.health.latencyMs.database} ms latency`
              }
            />
            <StatCard
              title="CPU"
              value={formatPercent(azureMetrics?.cpuPercent ?? null)}
              icon={Cpu}
              helper="Azure VM average"
            />
            <StatCard
              title="Available Memory"
              value={formatPercent(azureMetrics?.availableMemoryPercent ?? null)}
              icon={HardDrive}
              helper={formatBytes(azureMetrics?.availableMemoryBytes ?? null)}
            />
            <StatCard
              title="Latest Backup"
              value={latestBackup ? formatRelativeAge(latestBackup.createdAt) : "N/A"}
              icon={Files}
              helper={
                latestBackup
                  ? formatBytes(latestBackup.sizeBytes)
                  : "Database backup"
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <HealthScoreCard
              title="API Score"
              icon={Activity}
              score={metrics.api.healthScore.api}
              windowSeconds={metrics.api.healthScore.windowSeconds}
            />
            <HealthScoreCard
              title="DB Score"
              icon={Database}
              score={metrics.api.healthScore.database}
              windowSeconds={metrics.api.healthScore.windowSeconds}
            />
            <StatCard
              title="Uptime"
              value={formatUptime(metrics.api.uptimeSeconds)}
              icon={Timer}
              helper="Current API process"
            />
            <StatCard
              title="Requests"
              value={metrics.api.requestMetrics.requestCount}
              icon={LineChart}
              helper={`Last ${metrics.api.requestMetrics.windowMinutes} minutes`}
            />
            <StatCard
              title="Server Errors"
              value={metrics.api.requestMetrics.errorCount}
              icon={Activity}
              helper="HTTP 5xx responses"
            />
            <StatCard
              title="Client Errors"
              value={metrics.api.requestMetrics.clientErrorCount}
              icon={Activity}
              helper="HTTP 4xx responses"
            />
            <StatCard
              title="5xx Error Rate"
              value={`${metrics.api.requestMetrics.serverErrorRate}%`}
              icon={Activity}
              helper="Server error ratio"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="p50 Latency"
              value={`${metrics.api.requestMetrics.p50DurationMs} ms`}
              icon={Clock3}
              helper="Median response"
            />
            <StatCard
              title="p95 Latency"
              value={`${metrics.api.requestMetrics.p95DurationMs} ms`}
              icon={Clock3}
              helper="Tail response"
            />
            <StatCard
              title="Max Latency"
              value={`${metrics.api.requestMetrics.maxDurationMs} ms`}
              icon={Clock3}
              helper="Slowest response"
            />
            <StatCard
              title="4xx Error Rate"
              value={`${metrics.api.requestMetrics.clientErrorRate}%`}
              icon={Activity}
              helper="Client error ratio"
            />
            <StatCard
              title="Backup Freshness"
              value={
                metrics.backups.available
                  ? metrics.backups.freshnessStatus
                  : "critical"
              }
              icon={Files}
              helper={
                metrics.backups.available &&
                metrics.backups.latestBackupAgeHours !== null
                  ? `${metrics.backups.latestBackupAgeHours}h old`
                  : "No readable backup"
              }
            />
          </div>

          <section className="grid gap-5 xl:grid-cols-3">
            <ChartCard
              title="API Health Score"
              helper={`Last ${metrics.api.healthScore.windowSeconds} one-second checks`}
              info={`Shows whether the backend process is alive during the latest one-second probes. Successful checks: ${metrics.api.healthScore.api.successfulChecks}/${metrics.api.healthScore.api.totalChecks}. A stable 100% means the API process kept responding throughout the current short window.`}
              points={metrics.api.healthScore.probes.map((probe) =>
                probe.api ? 100 : 0,
              )}
              color="#059669"
              suffix="%"
              yLabel="success"
              xLabel="last 15 seconds"
              displayValue={`${metrics.api.healthScore.api.scorePercent}%`}
              sampleLabel={`${metrics.api.healthScore.api.successfulChecks}/${metrics.api.healthScore.api.totalChecks} successful`}
              formatter={(value) => `${value.toFixed(0)}%`}
            />
            <ChartCard
              title="Database Health Score"
              helper={`Last ${metrics.api.healthScore.windowSeconds} one-second checks`}
              info={`Shows how many recent database probes succeeded. Successful checks: ${metrics.api.healthScore.database.successfulChecks}/${metrics.api.healthScore.database.totalChecks}. If PostgreSQL is stopped or unreachable, this score drops quickly and the overall system status becomes critical.`}
              points={metrics.api.healthScore.probes.map((probe) =>
                probe.database ? 100 : 0,
              )}
              color="#2563eb"
              suffix="%"
              yLabel="success"
              xLabel="last 15 seconds"
              displayValue={`${metrics.api.healthScore.database.scorePercent}%`}
              sampleLabel={`${metrics.api.healthScore.database.successfulChecks}/${metrics.api.healthScore.database.totalChecks} successful`}
              formatter={(value) => `${value.toFixed(0)}%`}
            />
            <ChartCard
              title="Database Probe Latency"
              helper="One-second database probe latency"
              info="Measures how long the lightweight SELECT 1 database probe takes. Rising values can indicate database pressure, network delay, or container resource contention."
              points={metrics.api.healthScore.probes.map(
                (probe) => probe.databaseLatencyMs,
              )}
              color="#7c3aed"
              suffix=" ms"
              yLabel="ms"
              xLabel="last 15 seconds"
              displayValue={
                metrics.api.healthScore.probes.at(-1)?.databaseLatencyMs === null
                  ? "N/A"
                  : `${metrics.api.healthScore.probes.at(-1)?.databaseLatencyMs ?? 0} ms`
              }
              sampleLabel={`${metrics.api.healthScore.database.totalChecks} checks`}
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="border border-[#d8d4d2] bg-white p-5">
              <h2 className="text-lg font-bold text-[#1c1b1b]">
                Status Breakdown
              </h2>
              <p className="mt-1 text-sm text-[#747878]">
                HTTP response classes over the last 15 minutes.
              </p>
              <StatusBreakdownBar
                breakdown={metrics.api.requestMetrics.statusBreakdown}
              />
            </div>

            <div className="border border-[#d8d4d2] bg-white p-5">
              <h2 className="text-lg font-bold text-[#1c1b1b]">
                Latency Summary
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <MetricRow
                  label="Average"
                  value={`${metrics.api.requestMetrics.averageDurationMs} ms`}
                  icon={Clock3}
                />
                <MetricRow
                  label="p50"
                  value={`${metrics.api.requestMetrics.p50DurationMs} ms`}
                  icon={Clock3}
                />
                <MetricRow
                  label="p95"
                  value={`${metrics.api.requestMetrics.p95DurationMs} ms`}
                  icon={Clock3}
                />
                <MetricRow
                  label="Max"
                  value={`${metrics.api.requestMetrics.maxDurationMs} ms`}
                  icon={Clock3}
                />
              </div>
            </div>
          </section>

          {azureMetrics?.series && (
            <section className="grid gap-5 xl:grid-cols-3">
              <ChartCard
                title="CPU Trend"
                helper="Azure CPU average"
                info="Shows Azure Monitor's average VM CPU utilization over the latest 15-minute window. Short spikes are normal; sustained high CPU can signal capacity pressure."
                points={toNumberSeries(azureMetrics.series.cpuPercent)}
                color="#1c1b1b"
                suffix="%"
                yLabel="%"
                xLabel="last 15 minutes"
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <ChartCard
                title="Memory Trend"
                helper="Available memory percentage"
                info="Shows the VM's available memory percentage from Azure Monitor. Lower values mean the server has less free memory for the API, database, and system processes."
                points={toNumberSeries(
                  azureMetrics.series.availableMemoryPercent,
                )}
                color="#059669"
                suffix="%"
                yLabel="%"
                xLabel="last 15 minutes"
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <ChartCard
                title="Network Out"
                helper="Azure outbound traffic"
                info="Shows outbound network traffic reported by Azure Monitor. Spikes usually mean API responses, admin usage, mobile app traffic, deployments, or package downloads."
                points={toNumberSeries(azureMetrics.series.networkOutBytes)}
                color="#2563eb"
                suffix=""
                yLabel="bytes"
                xLabel="last 15 minutes"
                formatter={formatBytes}
              />
            </section>
          )}

          {azureMetrics?.series && (
            <section className="grid gap-5 xl:grid-cols-3">
              <ChartCard
                title="Disk Read Bytes"
                helper="Azure disk read throughput"
                info="Shows how many bytes the VM read from disk during each Azure Monitor interval. Spikes can indicate database reads, backups, application startup, or package operations."
                points={toNumberSeries(azureMetrics.series.diskReadBytes)}
                color="#6366f1"
                suffix=""
                yLabel="bytes"
                xLabel="last 15 minutes"
                formatter={formatBytes}
              />
              <ChartCard
                title="Disk Write Bytes"
                helper="Azure disk write throughput"
                info="Shows how many bytes the VM wrote to disk during each Azure Monitor interval. Spikes can come from database writes, backup generation, logs, or deployments."
                points={toNumberSeries(azureMetrics.series.diskWriteBytes)}
                color="#db2777"
                suffix=""
                yLabel="bytes"
                xLabel="last 15 minutes"
                formatter={formatBytes}
              />
              <ChartCard
                title="Disk Operations"
                helper="Read/write operations per second"
                info="Shows average disk read and write operations per second from Azure Monitor. High sustained operations can signal storage pressure or database-heavy activity."
                points={toNumberSeries(
                  azureMetrics.series.diskWriteOperationsPerSecond,
                )}
                color="#0f766e"
                suffix="/s"
                yLabel="ops/s"
                xLabel="last 15 minutes"
              />
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Avg Latency"
              value={`${metrics.api.requestMetrics.averageDurationMs} ms`}
              icon={Clock3}
              helper="Application responses"
            />
            <StatCard
              title="Last Check"
              value={new Date(metrics.checkedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
              icon={Clock3}
              helper="Auto refresh enabled"
            />
            <StatCard
              title="Commit"
              value={shortSha(metrics.api.commitSha)}
              icon={Server}
              helper="Running backend build"
            />
            <StatCard
              title="Environment"
              value={metrics.api.environment}
              icon={Server}
              helper="Runtime mode"
            />
          </div>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1c1b1b]">
                    Azure VM Metrics
                  </h2>
                  <p className="mt-1 text-sm text-[#444748]">
                    Latest 15-minute Azure Monitor summary.
                  </p>
                </div>

                <div
                  className={[
                    "rounded-full px-3 py-1 text-xs font-bold",
                    metrics.azure.available
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700",
                  ].join(" ")}
                >
                  {metrics.azure.available ? "Connected" : "Unavailable"}
                </div>
              </div>

              {metrics.azure.available ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricRow
                    label="VM Name"
                    value={metrics.azure.vmName}
                    icon={Server}
                  />
                  <MetricRow
                    label="Resource Group"
                    value={metrics.azure.resourceGroup}
                    icon={Server}
                  />
                  <MetricRow
                    label="Network In"
                    value={formatBytes(metrics.azure.metrics.networkInBytes)}
                    icon={Wifi}
                  />
                  <MetricRow
                    label="Network Out"
                    value={formatBytes(metrics.azure.metrics.networkOutBytes)}
                    icon={Wifi}
                  />
                  <MetricRow
                    label="Disk Read"
                    value={formatBytes(metrics.azure.metrics.diskReadBytes)}
                    icon={HardDrive}
                  />
                  <MetricRow
                    label="Disk Write"
                    value={formatBytes(metrics.azure.metrics.diskWriteBytes)}
                    icon={HardDrive}
                  />
                  <MetricRow
                    label="Disk Read Ops"
                    value={`${metrics.azure.metrics.diskReadOperationsPerSecond ?? "N/A"}/s`}
                    icon={HardDrive}
                  />
                  <MetricRow
                    label="Disk Write Ops"
                    value={`${metrics.azure.metrics.diskWriteOperationsPerSecond ?? "N/A"}/s`}
                    icon={HardDrive}
                  />
                  <MetricRow
                    label="Azure Checked At"
                    value={formatDate(metrics.azure.checkedAt)}
                    icon={Clock3}
                  />
                  <MetricRow
                    label="Subscription"
                    value={shortSha(metrics.azure.subscriptionId)}
                    icon={Server}
                  />
                </div>
              ) : (
                <div className="rounded-2xl bg-[#f7f3f2] p-4 text-sm font-semibold text-[#444748]">
                  {metrics.azure.reason}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <h2 className="text-lg font-bold text-[#1c1b1b]">
                Deployment
              </h2>
              <div className="mt-5 space-y-3">
                <DetailRow label="Environment" value={metrics.api.environment} />
                <DetailRow label="Commit" value={shortSha(metrics.api.commitSha)} />
                <DetailRow label="Built At" value={formatDate(metrics.api.builtAt)} />
                <DetailRow label="Checked At" value={formatDate(metrics.checkedAt)} />
                <DetailRow
                  label="Health Timestamp"
                  value={formatDate(metrics.api.health.timestamp)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1c1b1b]">
                  Backup Status
                </h2>
                <p className="mt-1 text-sm text-[#444748]">
                  Production database backup visibility from the VM backup
                  directory.
                </p>
              </div>

              <div
                className={[
                  "w-fit rounded-full px-3 py-1 text-xs font-bold",
                  metrics.backups.available
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700",
                ].join(" ")}
              >
                {metrics.backups.available ? "Available" : "Unavailable"}
              </div>
            </div>

            {metrics.backups.available ? (
              <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <MetricRow
                    label="Backup Count"
                    value={String(metrics.backups.backupCount)}
                    icon={Files}
                  />
                  <MetricRow
                    label="Total Size"
                    value={formatBytes(metrics.backups.totalSizeBytes)}
                    icon={HardDrive}
                  />
                  <MetricRow
                    label="Retention"
                    value={
                      metrics.backups.retentionDays === null
                        ? "Not set"
                        : `${metrics.backups.retentionDays} days`
                    }
                    icon={Clock3}
                  />
                  <MetricRow
                    label="Directory"
                    value={metrics.backups.backupDir}
                    icon={Server}
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left">
                    <thead>
                      <tr className="border-b border-[#eee9e8] text-xs font-bold uppercase tracking-[0.16em] text-[#747878]">
                        <th className="py-3 pr-4">File</th>
                        <th className="py-3 pr-4">Size</th>
                        <th className="py-3 pr-4">Created</th>
                        <th className="py-3">Age</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.backups.recentBackups.map((backup) => (
                        <tr
                          key={backup.fileName}
                          className="border-b border-[#f1edec] text-sm font-semibold last:border-0"
                        >
                          <td className="max-w-[340px] truncate py-3 pr-4 text-[#1c1b1b]">
                            {backup.fileName}
                          </td>
                          <td className="py-3 pr-4 text-[#444748]">
                            {formatBytes(backup.sizeBytes)}
                          </td>
                          <td className="py-3 pr-4 text-[#444748]">
                            {formatDate(backup.createdAt)}
                          </td>
                          <td className="py-3 text-[#747878]">
                            {formatRelativeAge(backup.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#f7f3f2] p-4 text-sm font-semibold text-[#444748]">
                {metrics.backups.reason}
              </div>
            )}
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <EndpointTable
              title="Slow Endpoints"
              helper="Highest average latency in the current window."
              endpoints={metrics.api.requestMetrics.slowEndpoints}
              emptyText="No endpoint traffic yet."
            />
            <EndpointTable
              title="Top Error Endpoints"
              helper="Endpoints with the most HTTP 5xx responses."
              endpoints={metrics.api.requestMetrics.topErrorEndpoints}
              emptyText="No server errors recorded."
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <ChartCard
              title="Request Volume"
              helper="Requests per minute"
              info="Counts API requests grouped by minute for the current 15-minute window. It helps reveal traffic bursts, admin activity, mobile app usage, and smoke test runs."
              points={metrics.api.requestMetrics.requestsPerMinute.map(
                (point) => point.requestCount,
              )}
              color="#1c1b1b"
              suffix=""
              yLabel="req"
              xLabel="last 15 minutes"
            />
            <ChartCard
              title="Server Errors"
              helper="5xx responses per minute"
              info="Counts server-side failures per minute. Any non-zero value deserves attention because it means the backend returned an internal error to a client."
              points={metrics.api.requestMetrics.requestsPerMinute.map(
                (point) => point.errorCount,
              )}
              color="#dc2626"
              suffix=""
              yLabel="errors"
              xLabel="last 15 minutes"
            />
            <ChartCard
              title="Response Time"
              helper="Average latency per minute"
              info="Shows average backend response time per minute. Higher latency can point to slow database queries, infrastructure load, or endpoints that need optimization."
              points={metrics.api.requestMetrics.requestsPerMinute.map(
                (point) => point.averageDurationMs,
              )}
              color="#2563eb"
              suffix=" ms"
              yLabel="ms"
              xLabel="last 15 minutes"
            />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#1c1b1b]">
                Recent Requests
              </h2>
              <p className="mt-1 text-sm text-[#444748]">
                Latest API responses captured by the backend process.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-[#eee9e8] text-xs font-bold uppercase tracking-[0.16em] text-[#747878]">
                    <th className="py-3 pr-4">Method</th>
                    <th className="py-3 pr-4">Path</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Duration</th>
                    <th className="py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.api.requestMetrics.latestRequests.map((request) => (
                    <tr
                      key={`${request.timestamp}-${request.method}-${request.path}`}
                      className="border-b border-[#f1edec] text-sm font-semibold last:border-0"
                    >
                      <td className="py-3 pr-4 text-[#1c1b1b]">
                        {request.method}
                      </td>
                      <td className="max-w-[360px] truncate py-3 pr-4 text-[#444748]">
                        {request.path}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs font-bold",
                            request.statusCode >= 500
                              ? "bg-red-50 text-red-700"
                              : request.statusCode >= 400
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700",
                          ].join(" ")}
                        >
                          {request.statusCode}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[#444748]">
                        {request.durationMs} ms
                      </td>
                      <td className="py-3 text-[#747878]">
                        {new Date(request.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function MetricRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#f7f3f2] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1c1b1b]">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#747878]">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-bold text-[#1c1b1b]">
          {value}
        </p>
      </div>
    </div>
  );
}

function HealthScoreCard({
  title,
  score,
  windowSeconds,
  icon: Icon,
}: {
  title: string;
  score: HealthScore;
  windowSeconds: number;
  icon: LucideIcon;
}) {
  const color =
    score.scorePercent >= 100
      ? "#059669"
      : score.scorePercent >= 90
        ? "#d97706"
        : "#dc2626";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5 text-[#444748]">
            {title}
          </p>
          <p className="mt-2 whitespace-nowrap text-2xl font-bold leading-tight text-[#1c1b1b]">
            {score.scorePercent}%
          </p>
          <p className="mt-1 text-xs font-bold text-[#444748]">
            {score.successfulChecks}/{score.totalChecks} successful
          </p>
          <p className="mt-1 text-xs leading-5 text-[#747878]">
            Last {windowSeconds} seconds
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f7f3f2] text-[#1c1b1b]">
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee9e8]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${score.scorePercent}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/70 bg-white/70 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-[#747878]">
        {label}
      </p>
      <p className="mt-1 text-lg text-[#1c1b1b]">{value}</p>
    </div>
  );
}

function StatusBreakdownBar({
  breakdown,
}: {
  breakdown: {
    success: number;
    redirect: number;
    clientError: number;
    serverError: number;
  };
}) {
  const total =
    breakdown.success +
    breakdown.redirect +
    breakdown.clientError +
    breakdown.serverError;
  const segments = [
    {
      label: "2xx",
      value: breakdown.success,
      color: "#059669",
    },
    {
      label: "3xx",
      value: breakdown.redirect,
      color: "#2563eb",
    },
    {
      label: "4xx",
      value: breakdown.clientError,
      color: "#d97706",
    },
    {
      label: "5xx",
      value: breakdown.serverError,
      color: "#dc2626",
    },
  ];

  return (
    <div className="mt-5">
      <div className="flex h-8 overflow-hidden border border-[#d8d4d2] bg-[#f7f3f2]">
        {segments.map((segment) => {
          const width = total === 0 ? 0 : (segment.value / total) * 100;

          return (
            <div
              key={segment.label}
              style={{
                width: `${width}%`,
                backgroundColor: segment.color,
              }}
            />
          );
        })}
        {total === 0 && <div className="h-full w-full bg-[#eee9e8]" />}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <span className="font-bold text-[#1c1b1b]">{segment.label}</span>
            <span className="font-semibold text-[#747878]">
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EndpointTable({
  title,
  helper,
  endpoints,
  emptyText,
}: {
  title: string;
  helper: string;
  endpoints: EndpointSummary[];
  emptyText: string;
}) {
  return (
    <section className="border border-[#d8d4d2] bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#1c1b1b]">{title}</h2>
        <p className="mt-1 text-sm text-[#747878]">{helper}</p>
      </div>

      {endpoints.length === 0 ? (
        <div className="bg-[#f7f3f2] p-4 text-sm font-semibold text-[#747878]">
          {emptyText}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-[#eee9e8] text-xs font-bold uppercase tracking-[0.16em] text-[#747878]">
                <th className="py-3 pr-4">Endpoint</th>
                <th className="py-3 pr-4">Avg</th>
                <th className="py-3 pr-4">Max</th>
                <th className="py-3 pr-4">Req</th>
                <th className="py-3">5xx</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="border-b border-[#f1edec] text-sm font-semibold last:border-0"
                >
                  <td className="max-w-[340px] truncate py-3 pr-4 text-[#1c1b1b]">
                    {endpoint.method} {endpoint.path}
                  </td>
                  <td className="py-3 pr-4 text-[#444748]">
                    {endpoint.averageDurationMs} ms
                  </td>
                  <td className="py-3 pr-4 text-[#444748]">
                    {endpoint.maxDurationMs} ms
                  </td>
                  <td className="py-3 pr-4 text-[#444748]">
                    {endpoint.requestCount}
                  </td>
                  <td className="py-3 text-[#444748]">{endpoint.errorCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ChartCard({
  title,
  helper,
  info,
  points,
  color,
  suffix,
  yLabel,
  xLabel,
  displayValue,
  sampleLabel,
  formatter,
}: {
  title: string;
  helper: string;
  info: string;
  points: Array<number | null>;
  color: string;
  suffix: string;
  yLabel: string;
  xLabel: string;
  displayValue?: string;
  sampleLabel?: string;
  formatter?: (value: number) => string;
}) {
  const numericPoints = points.filter((point): point is number => point !== null);
  const max = Math.max(...numericPoints, 1);
  const min = Math.min(...numericPoints, 0);
  const range = Math.max(max - min, 1);
  const width = 360;
  const height = 190;
  const padding = {
    top: 18,
    right: 18,
    bottom: 42,
    left: 58,
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const chartPoints = points.map((point, index) => {
    if (point === null) {
      return null;
    }

    const x =
      padding.left +
      (points.length === 1 ? 0 : (index / (points.length - 1)) * chartWidth);
    const y = padding.top + chartHeight - ((point - min) / range) * chartHeight;

    return `${x},${y}`;
  });
  const latest = numericPoints.at(-1) ?? 0;
  const formattedLatest =
    displayValue ?? (formatter ? formatter(latest) : `${latest}${suffix}`);
  const formatAxisValue = (value: number) => {
    if (formatter) {
      return formatter(value);
    }

    return `${Math.round(value)}${suffix}`;
  };
  const yTicks = [max, min + range / 2, min];
  const chartSegments = chartPoints.reduce<string[][]>((segments, point) => {
    if (point === null) {
      if (segments.at(-1)?.length) {
        segments.push([]);
      }

      return segments;
    }

    if (segments.length === 0) {
      segments.push([]);
    }

    segments[segments.length - 1].push(point);
    return segments;
  }, []);

  return (
    <div className="border border-[#d8d4d2] bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1c1b1b]">{title}</h2>
            <div className="group relative inline-flex">
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#2563eb] text-xs font-bold text-[#2563eb] outline-none transition hover:bg-blue-50 focus:bg-blue-50"
                aria-label={`${title} metric information`}
              >
                i
              </button>
              <div className="pointer-events-none absolute left-1/2 top-7 z-30 w-72 -translate-x-1/2 border border-[#d8d4d2] bg-white p-3 text-sm font-semibold leading-5 text-[#444748] opacity-0 shadow-[0_10px_28px_rgba(26,26,26,0.12)] transition group-hover:opacity-100 group-focus-within:opacity-100">
                <p className="font-bold text-[#1c1b1b]">{title}</p>
                <p className="mt-1">{info}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#747878]">
                  Y axis: {yLabel} / X axis: {xLabel}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-1 text-sm text-[#747878]">{helper}</p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full overflow-visible"
        role="img"
        aria-label={title}
      >
        <text
          x={padding.left}
          y="10"
          fill="#747878"
          fontSize="10"
          fontWeight="700"
        >
          {yLabel}
        </text>
        {yTicks.map((tick) => {
          const y = padding.top + chartHeight - ((tick - min) / range) * chartHeight;

          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#d6d3d1"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="#747878"
                fontSize="10"
                textAnchor="end"
              >
                {formatAxisValue(tick)}
              </text>
            </g>
          );
        })}
        <line
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={height - padding.bottom}
          stroke="#c2bfbd"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={height - padding.bottom}
          y2={height - padding.bottom}
          stroke="#c2bfbd"
          strokeWidth="1"
        />
        {chartSegments.map((segment, index) => (
          <polyline
            key={`${title}-${index}`}
            fill="none"
            points={segment.join(" ")}
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ))}
        {chartPoints.map((point, index) => {
          if (point === null) {
            return null;
          }

          const [x, y] = point.split(',');

          return (
            <circle
              key={`${point}-${index}`}
              cx={x}
              cy={y}
              r="2"
              fill="#ffffff"
              stroke={color}
              strokeWidth="1.5"
            />
          );
        })}
        <text
          x={padding.left}
          y={height - padding.bottom + 22}
          fill="#747878"
          fontSize="10"
        >
          start
        </text>
        <text
          x={width - padding.right}
          y={height - padding.bottom + 22}
          fill="#747878"
          fontSize="10"
          textAnchor="end"
        >
          now
        </text>
        <text
          x={padding.left}
          y={height - 6}
          fill="#747878"
          fontSize="10"
          fontWeight="700"
        >
          {xLabel}
        </text>
      </svg>

      <div className="mt-3 flex items-end gap-3 border-t border-[#eee9e8] pt-4">
        <div className="h-12 w-1.5 shrink-0" style={{ backgroundColor: color }} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#444748]">{title}</p>
          <p className="mt-1 text-2xl font-bold leading-none text-[#1c1b1b]">
            {formattedLatest}
          </p>
          {sampleLabel && (
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#747878]">
              {sampleLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#eee9e8] pb-3 last:border-0 last:pb-0">
      <span className="text-sm font-semibold text-[#747878]">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-bold text-[#1c1b1b]">
        {value}
      </span>
    </div>
  );
}
