import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  ExternalLink,
  FileClock,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { getApiErrorMessage } from "../api/errors";

type AuditLog = {
  id: string;
  actorId?: string | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  metadata?: unknown;
  createdAt: string;
};

const actionLabels: Record<string, string> = {
  "category.create": "Category created",
  "category.update": "Category updated",
  "customer.status_update": "Customer status changed",
  "order.fulfillment_update": "Order fulfillment updated",
  "order.status_update": "Order status changed",
  "order.tracking_update": "Order tracking updated",
  "product.create": "Product created",
  "product.status_update": "Product status changed",
  "product.update": "Product updated",
  "storefront.update": "Storefront updated",
};

function formatAction(action: string) {
  return (
    actionLabels[action] ??
    action
      .replaceAll(".", " ")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatMetadata(metadata: unknown) {
  if (!metadata) {
    return "-";
  }

  if (typeof metadata !== "object") {
    return String(metadata);
  }

  return Object.entries(metadata)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")}`;
      }

      if (value === null || value === undefined) {
        return `${key}: -`;
      }

      if (typeof value === "object") {
        return `${key}: ${JSON.stringify(value)}`;
      }

      return `${key}: ${String(value)}`;
    })
    .join(" | ");
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const entityTypes = useMemo(
    () => Array.from(new Set(logs.map((log) => log.entityType))).sort(),
    [logs],
  );

  const actions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.action))).sort(),
    [logs],
  );

  const filteredLogs = logs.filter((log) => {
    const searchValue = [
      log.actorEmail,
      log.action,
      log.entityType,
      log.entityId,
      log.entityLabel,
      formatMetadata(log.metadata),
    ]
      .join(" ")
      .toLowerCase();

    return (
      searchValue.includes(query.toLowerCase().trim()) &&
      (entityFilter === "all" || log.entityType === entityFilter) &&
      (actionFilter === "all" || log.action === actionFilter)
    );
  });

  const actorCount = useMemo(
    () => new Set(logs.map((log) => log.actorEmail)).size,
    [logs],
  );

  async function loadLogs() {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.get<AuditLog[]>("/admin/audit-logs");
      setLogs(response.data);
    } catch (error) {
      setError(getApiErrorMessage(error, "Audit logs could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-[#444748]">
            SECURITY
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#1c1b1b]">Audit Logs</h1>
          <p className="mt-2 text-sm text-[#444748]">
            Track admin actions across products, orders, customers, categories,
            and storefront settings.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1c1b1b] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={FileClock}
          label="Events"
          value={logs.length}
          helper="Latest 100 records"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Actors"
          value={actorCount}
          helper="Distinct admin accounts"
        />
        <SummaryCard
          icon={Clock3}
          label="Last Event"
          value={logs[0] ? new Date(logs[0].createdAt).toLocaleTimeString() : "-"}
          helper={logs[0] ? formatAction(logs[0].action) : "No activity yet"}
        />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_220px_260px]">
        <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
          <Search size={18} className="text-[#747878]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search actor, action, entity, or metadata"
            className="w-full bg-transparent text-sm font-medium text-[#1c1b1b] outline-none placeholder:text-[#747878]"
          />
        </label>

        <select
          value={entityFilter}
          onChange={(event) => setEntityFilter(event.target.value)}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#1c1b1b] shadow-[0_8px_28px_rgba(26,26,26,0.05)] outline-none"
        >
          <option value="all">All entities</option>
          {entityTypes.map((entityType) => (
            <option key={entityType} value={entityType}>
              {entityType}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#1c1b1b] shadow-[0_8px_28px_rgba(26,26,26,0.05)] outline-none"
        >
          <option value="all">All actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {formatAction(action)}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="rounded-2xl bg-white p-6 text-sm font-medium text-[#444748]">
          Loading audit logs...
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left">
              <thead className="bg-[#f7f3f2] text-xs uppercase tracking-[0.12em] text-[#444748]">
                <tr>
                  <th className="px-5 py-4 font-bold">Time</th>
                  <th className="px-5 py-4 font-bold">Actor</th>
                  <th className="px-5 py-4 font-bold">Action</th>
                  <th className="px-5 py-4 font-bold">Entity</th>
                  <th className="px-5 py-4 font-bold">Metadata</th>
                  <th className="px-5 py-4 font-bold">Detail</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f1edec]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fdf8f8]">
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-[#1c1b1b]">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                      <p className="mt-1 text-xs text-[#747878]">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[#1c1b1b]">
                        {log.actorEmail}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#747878]">
                        {log.actorRole}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#f7f3f2] px-3 py-1 text-xs font-bold text-[#1c1b1b]">
                        {formatAction(log.action)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-bold capitalize text-[#1c1b1b]">
                        {log.entityType}
                      </p>
                      <p className="mt-1 max-w-[260px] truncate text-xs text-[#747878]">
                        {log.entityLabel ?? log.entityId ?? "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[420px] truncate text-sm text-[#444748]">
                        {formatMetadata(log.metadata)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        to={`/audit-logs/${log.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[#1c1b1b] px-4 py-2 text-xs font-bold text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
                      >
                        View
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-[#747878]"
                    >
                      No audit log records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof FileClock;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#747878]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#1c1b1b]">{value}</p>
          <p className="mt-1 text-xs font-medium text-[#747878]">{helper}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f3f2] text-[#1c1b1b]">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
