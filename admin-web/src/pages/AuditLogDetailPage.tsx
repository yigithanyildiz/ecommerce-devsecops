import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Fingerprint, ShieldCheck } from "lucide-react";
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

function formatJson(value: unknown) {
  if (value === null || value === undefined) {
    return "{}";
  }

  return JSON.stringify(value, null, 2);
}

export function AuditLogDetailPage() {
  const { auditLogId } = useParams();
  const [auditLog, setAuditLog] = useState<AuditLog | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAuditLog() {
      if (!auditLogId) return;

      setError("");
      setIsLoading(true);

      try {
        const response = await api.get<AuditLog>(`/admin/audit-logs/${auditLogId}`);
        setAuditLog(response.data);
      } catch (error) {
        setError(getApiErrorMessage(error, "Audit log detail could not be loaded."));
      } finally {
        setIsLoading(false);
      }
    }

    loadAuditLog();
  }, [auditLogId]);

  return (
    <div>
      <div className="mb-8">
        <Link
          to="/audit-logs"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#444748] transition hover:text-[#1c1b1b]"
        >
          <ArrowLeft size={16} />
          Back to Audit Logs
        </Link>

        <div className="mt-5 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.22em] text-[#444748]">
              AUDIT DETAIL
            </p>
            <h1 className="mt-2 break-words text-3xl font-bold text-[#1c1b1b]">
              {auditLog ? formatAction(auditLog.action) : "Audit Log"}
            </h1>
            <p className="mt-2 text-sm text-[#444748]">
              Review the actor, target entity, captured metadata, and timestamp
              for this admin operation.
            </p>
          </div>

          {auditLog && (
            <span className="rounded-full bg-[#1c1b1b] px-4 py-2 text-sm font-bold capitalize text-white">
              {auditLog.entityType}
            </span>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl bg-white p-6 text-sm font-medium text-[#444748]">
          Loading audit log...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {auditLog && (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="min-w-0 space-y-5">
            <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f3f2] text-[#1c1b1b]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-[#1c1b1b]">Operation</h2>
                  <p className="text-sm text-[#444748]">
                    {formatAction(auditLog.action)}
                  </p>
                </div>
              </div>

              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <DetailCard label="Action Key" value={auditLog.action} />
                <DetailCard label="Entity Type" value={auditLog.entityType} />
                <DetailCard
                  label="Entity Label"
                  value={auditLog.entityLabel ?? "-"}
                />
                <DetailCard label="Entity ID" value={auditLog.entityId ?? "-"} />
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <h2 className="font-bold text-[#1c1b1b]">Metadata</h2>
              <p className="mt-1 text-sm text-[#444748]">
                Payload captured for the action. Sensitive values should not be
                stored here.
              </p>

              <pre className="mt-5 max-h-[460px] max-w-full overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-[#1c1b1b] p-5 text-xs leading-6 text-white">
                {formatJson(auditLog.metadata)}
              </pre>
            </div>
          </section>

          <aside className="min-w-0 space-y-5">
            <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f3f2] text-[#1c1b1b]">
                  <Fingerprint size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-[#1c1b1b]">Actor</h2>
                  <p className="text-sm text-[#444748]">Admin account</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <DetailRow label="Email" value={auditLog.actorEmail} />
                <DetailRow label="Role" value={auditLog.actorRole} />
                <DetailRow label="User ID" value={auditLog.actorId ?? "-"} />
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f3f2] text-[#1c1b1b]">
                  <CalendarClock size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-[#1c1b1b]">Timeline</h2>
                  <p className="text-sm text-[#444748]">Recorded timestamp</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <DetailRow
                  label="Date"
                  value={new Date(auditLog.createdAt).toLocaleDateString()}
                />
                <DetailRow
                  label="Time"
                  value={new Date(auditLog.createdAt).toLocaleTimeString()}
                />
                <DetailRow
                  label="Raw"
                  value={new Date(auditLog.createdAt).toISOString()}
                />
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <h2 className="font-bold text-[#1c1b1b]">Record ID</h2>
              <p className="mt-3 break-all rounded-2xl bg-[#f7f3f2] p-4 text-xs font-semibold text-[#444748]">
                {auditLog.id}
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-[#f7f3f2] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#747878]">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold text-[#1c1b1b]">
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-[#f1edec] pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-4">
      <span className="shrink-0 font-semibold text-[#444748]">{label}</span>
      <span className="min-w-0 break-words text-left font-bold text-[#1c1b1b] sm:text-right">
        {value}
      </span>
    </div>
  );
}
