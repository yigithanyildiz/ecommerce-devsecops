import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";

type OrderDetail = {
  id: string;
  status: string;
  totalAmount: string;
  recipientName?: string | null;
  phone?: string | null;
  shippingCity?: string | null;
  shippingAddressLine?: string | null;
  paymentMethod?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    productName: string;
    unitPrice: string;
    quantity: number;
    lineTotal: string;
    product?: {
      imageUrl?: string | null;
    } | null;
  }>;
};

export function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;

      setError("");
      setIsLoading(true);

      try {
        const response = await api.get<OrderDetail>(`/admin/orders/${orderId}`);
        setOrder(response.data);
        setSelectedStatus(response.data.status);
        setTrackingNumber(response.data.trackingNumber ?? "");
      } catch {
        setError("Order detail could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);
  async function updateStatus() {
    if (!order || !selectedStatus) return;
  
    setIsUpdatingStatus(true);
    setError("");
  
    try {
      const response = await api.patch<OrderDetail>(
        `/admin/orders/${order.id}/fulfillment`,
        {
          status: selectedStatus,
          trackingNumber: trackingNumber.trim() || null,
        },
      );
  
      setOrder(response.data);
      setSelectedStatus(response.data.status);
      setTrackingNumber(response.data.trackingNumber ?? "");
    } catch {
      setError("Order status could not be updated.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#444748] transition hover:text-[#1c1b1b]"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#444748]">
              ORDER DETAIL
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#1c1b1b]">
              {order ? `#${order.id.slice(0, 8)}` : "Order"}
            </h1>
            <p className="mt-2 text-sm text-[#444748]">
              Customer, items, payment total, and fulfillment status.
            </p>
          </div>

          {order && <StatusBadge status={order.status} />}
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl bg-white p-6 text-sm font-medium text-[#444748]">
          Loading order...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {order && (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f3f2] text-[#1c1b1b]">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-[#1c1b1b]">Items</h2>
                  <p className="text-sm text-[#444748]">
                    {order.items.length} products in this order
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#f1edec]">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="h-20 w-16 overflow-hidden rounded-2xl bg-[#f7f3f2]">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[#747878]">
                          No img
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#1c1b1b]">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-sm text-[#444748]">
                        {item.quantity} × ${item.unitPrice}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-[#1c1b1b]">
                      ${item.lineTotal}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <h2 className="font-bold text-[#1c1b1b]">Customer</h2>
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="font-semibold text-[#1c1b1b]">Name:</span>{" "}
                  <span className="text-[#444748]">
                    {order.user?.name ?? "-"}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-[#1c1b1b]">Email:</span>{" "}
                  <span className="text-[#444748]">
                    {order.user?.email ?? "-"}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <h2 className="font-bold text-[#1c1b1b]">Delivery</h2>
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="font-semibold text-[#1c1b1b]">
                    Recipient:
                  </span>{" "}
                  <span className="text-[#444748]">
                    {order.recipientName ?? "-"}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-[#1c1b1b]">Phone:</span>{" "}
                  <span className="text-[#444748]">{order.phone ?? "-"}</span>
                </p>
                <p>
                  <span className="font-semibold text-[#1c1b1b]">City:</span>{" "}
                  <span className="text-[#444748]">
                    {order.shippingCity ?? "-"}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-[#1c1b1b]">Address:</span>{" "}
                  <span className="text-[#444748]">
                    {order.shippingAddressLine ?? "-"}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <h2 className="font-bold text-[#1c1b1b]">Summary</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[#444748]">Created</span>
                  <span className="font-medium text-[#1c1b1b]">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#444748]">Updated</span>
                  <span className="font-medium text-[#1c1b1b]">
                    {new Date(order.updatedAt).toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-[#f1edec] pt-3">
                  <div className="mb-3 flex justify-between gap-4">
                    <span className="text-[#444748]">Payment</span>
                    <span className="font-medium text-[#1c1b1b]">
                      {formatPaymentMethod(order.paymentMethod)}
                    </span>
                  </div>

                  <div className="mb-3 flex justify-between gap-4">
                    <span className="text-[#444748]">Tracking</span>
                    <span className="font-medium text-[#1c1b1b]">
                      {order.trackingNumber ?? "-"}
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-4">
                    <span className="font-bold text-[#1c1b1b]">Total</span>
                    <span className="text-2xl font-bold text-[#1c1b1b]">
                      ${order.totalAmount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <h2 className="font-bold text-[#1c1b1b]">Fulfillment</h2>
              <p className="mt-2 text-sm text-[#444748]">
                Update the order status as it moves through fulfillment.
              </p>

              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="mt-4 w-full rounded-2xl bg-[#f7f3f2] px-4 py-3 text-sm font-semibold text-[#1c1b1b] outline-none ring-1 ring-transparent transition focus:ring-[#1c1b1b]"
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="PREPARING">Preparing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <input
                value={trackingNumber}
                onChange={(event) => setTrackingNumber(event.target.value)}
                placeholder="Tracking number"
                className="mt-3 w-full rounded-2xl bg-[#f7f3f2] px-4 py-3 text-sm font-semibold text-[#1c1b1b] outline-none ring-1 ring-transparent transition focus:ring-[#1c1b1b]"
              />

              <button
                onClick={updateStatus}
                disabled={isUpdatingStatus || !selectedStatus}
                className="mt-4 w-full rounded-full bg-[#1c1b1b] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdatingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function formatPaymentMethod(paymentMethod?: string | null) {
  if (paymentMethod === "DEMO_CARD") {
    return "Demo Card";
  }

  if (paymentMethod === "CASH_ON_DELIVERY") {
    return "Cash on Delivery";
  }

  return paymentMethod ?? "-";
}
