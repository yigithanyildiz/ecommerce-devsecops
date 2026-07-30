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
        database: number;
      };
    };
    requestMetrics: {
      windowMinutes: number;
      requestCount: number;
      errorCount: number;
      clientErrorCount: number;
      averageDurationMs: number;
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
          series: {
            cpuPercent: MetricPoint[];
            availableMemoryBytes: MetricPoint[];
            availableMemoryPercent: MetricPoint[];
            networkInBytes: MetricPoint[];
            networkOutBytes: MetricPoint[];
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              helper={`${metrics.api.health.latencyMs.database} ms latency`}
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
          </div>

          {azureMetrics?.series && (
            <section className="grid gap-5 xl:grid-cols-3">
              <ChartCard
                title="CPU Trend"
                helper="Azure CPU average"
                points={toNumberSeries(azureMetrics.series.cpuPercent)}
                color="#1c1b1b"
                suffix="%"
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <ChartCard
                title="Memory Trend"
                helper="Available memory percentage"
                points={toNumberSeries(
                  azureMetrics.series.availableMemoryPercent,
                )}
                color="#059669"
                suffix="%"
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <ChartCard
                title="Network Out"
                helper="Azure outbound traffic"
                points={toNumberSeries(azureMetrics.series.networkOutBytes)}
                color="#2563eb"
                suffix=""
                formatter={formatBytes}
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

          <section className="grid gap-5 xl:grid-cols-3">
            <ChartCard
              title="Request Volume"
              helper="Requests per minute"
              points={metrics.api.requestMetrics.requestsPerMinute.map(
                (point) => point.requestCount,
              )}
              color="#1c1b1b"
              suffix=""
            />
            <ChartCard
              title="Server Errors"
              helper="5xx responses per minute"
              points={metrics.api.requestMetrics.requestsPerMinute.map(
                (point) => point.errorCount,
              )}
              color="#dc2626"
              suffix=""
            />
            <ChartCard
              title="Response Time"
              helper="Average latency per minute"
              points={metrics.api.requestMetrics.requestsPerMinute.map(
                (point) => point.averageDurationMs,
              )}
              color="#2563eb"
              suffix=" ms"
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

function ChartCard({
  title,
  helper,
  points,
  color,
  suffix,
  formatter,
}: {
  title: string;
  helper: string;
  points: number[];
  color: string;
  suffix: string;
  formatter?: (value: number) => string;
}) {
  const max = Math.max(...points, 1);
  const width = 320;
  const height = 120;
  const chartPoints = points.map((point, index) => {
    const x = points.length === 1 ? 0 : (index / (points.length - 1)) * width;
    const y = height - (point / max) * height;

    return `${x},${y}`;
  });
  const latest = points.at(-1) ?? 0;
  const formattedLatest = formatter ? formatter(latest) : `${latest}${suffix}`;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1c1b1b]">{title}</h2>
          <p className="mt-1 text-sm text-[#747878]">{helper}</p>
        </div>
        <div className="rounded-full bg-[#f7f3f2] px-3 py-1 text-sm font-bold text-[#1c1b1b]">
          {formattedLatest}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-32 w-full overflow-visible"
        role="img"
        aria-label={title}
      >
        {[0, 1, 2].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={(height / 2) * line}
            y2={(height / 2) * line}
            stroke="#eee9e8"
            strokeWidth="1"
          />
        ))}
        <polyline
          fill="none"
          points={chartPoints.join(" ")}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
      </svg>
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
