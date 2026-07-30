import { useEffect, useState } from "react";
import {
  Activity,
  Clock3,
  Cpu,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Wifi,
} from "lucide-react";
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
        };
      }
    | {
        available: false;
        reason: string;
      };
};

function formatDate(value: string) {
  if (value === "local") {
    return "local";
  }

  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
  return value === "local" ? value : value.slice(0, 8);
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
  }, []);

  const azureMetrics = metrics?.azure.available
    ? metrics.azure.metrics
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
  icon: typeof Server;
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
