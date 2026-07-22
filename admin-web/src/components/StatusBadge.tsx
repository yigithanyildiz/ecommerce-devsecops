type StatusBadgeProps = {
    status: string;
  };
  
  const statusStyles: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-800",
    PAID: "bg-emerald-50 text-emerald-700",
    PREPARING: "bg-[#f7f3f2] text-[#1c1b1b]",
    SHIPPED: "bg-slate-100 text-slate-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-red-50 text-red-700",
  };
  
  const statusLabels: Record<string, string> = {
    PENDING: "Pending",
    PAID: "Paid",
    PREPARING: "Preparing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  
  export function StatusBadge({ status }: StatusBadgeProps) {
    return (
      <span
        className={[
          "rounded-full px-3 py-1 text-xs font-bold",
          statusStyles[status] ?? "bg-gray-100 text-gray-700",
        ].join(" ")}
      >
        {statusLabels[status] ?? status}
      </span>
    );
  }