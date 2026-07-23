import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { RefreshCcw } from "lucide-react";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";

type Order = {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    lineTotal: string;
  }>;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};
const orderStatuses = [
  "PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  async function loadOrders() {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.get<Order[]>("/admin/orders");
      setOrders(response.data);
    } catch (error) {
      setError(getErrorMessage(error, "Orders could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }

  async function updateOrderStatus(order: Order, status: string) {
    if (order.status === status || updatingOrderId) return;

    setError("");
    setUpdatingOrderId(order.id);

    const previousOrders = orders;
    setOrders((current) =>
      current.map((currentOrder) =>
        currentOrder.id === order.id
          ? {
              ...currentOrder,
              status,
            }
          : currentOrder,
      ),
    );

    try {
      await api.patch(`/admin/orders/${order.id}/status`, {
        status,
      });

      await loadOrders();
    } catch (error) {
      setOrders(previousOrders);
      setError(
        getErrorMessage(error, "Order status could not be updated."),
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function getErrorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status && message) {
        return `${fallback} (${status}: ${message})`;
      }

      if (status) {
        return `${fallback} (${status})`;
      }
    }

    return fallback;
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-[#444748]">
            OPERATIONS
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#1c1b1b]">Orders</h1>
          <p className="mt-2 text-sm text-[#444748]">
            Track customer purchases and fulfillment status.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1c1b1b] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="rounded-2xl bg-white p-6 text-sm font-medium text-[#444748]">
          Loading orders...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#f7f3f2] text-xs uppercase tracking-[0.12em] text-[#444748]">
                <tr>
                  <th className="px-5 py-4 font-bold">Order</th>
                  <th className="px-5 py-4 font-bold">Customer</th>
                  <th className="px-5 py-4 font-bold">Items</th>
                  <th className="px-5 py-4 font-bold">Total</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f1edec]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#fdf8f8]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#1c1b1b]">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="mt-1 text-xs text-[#747878]">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[#1c1b1b]">
                        {order.user?.name ?? "-"}
                      </p>
                      <p className="mt-1 text-xs text-[#747878]">
                        {order.user?.email ?? "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#444748]">
                      {order.items.length}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-[#1c1b1b]">
                      ${order.totalAmount}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />

                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(event) =>
                            updateOrderStatus(order, event.target.value)
                          }
                          className="rounded-full bg-[#f7f3f2] px-3 py-2 text-xs font-bold text-[#1c1b1b] outline-none transition focus:ring-1 focus:ring-[#1c1b1b] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/orders/${order.id}`}
                        className="rounded-full border border-[#1c1b1b] px-4 py-2 text-sm font-bold text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-[#747878]"
                    >
                      No orders found.
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
