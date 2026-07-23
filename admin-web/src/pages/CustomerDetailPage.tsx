import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, PackageCheck, UserRound } from "lucide-react";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";

type CustomerDetail = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
  favoriteCount: number;
  totalSpent: string;
  lastOrderAt?: string | null;
  orders: Array<{
    id: string;
    status: string;
    totalAmount: string;
    createdAt: string;
    items: Array<{
      id: string;
      productName: string;
      quantity: number;
      lineTotal: string;
      product?: {
        imageUrl?: string | null;
      } | null;
    }>;
  }>;
};

export function CustomerDetailPage() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  async function loadCustomer() {
    if (!customerId) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await api.get<CustomerDetail>(
        `/admin/customers/${customerId}`,
      );
      setCustomer(response.data);
    } catch (error) {
      setError(getErrorMessage(error, "Customer detail could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleCustomerStatus() {
    if (!customer) return;

    setError("");
    setIsUpdatingStatus(true);

    try {
      await api.patch(`/admin/customers/${customer.id}/status`, {
        isActive: !customer.isActive,
      });
      await loadCustomer();
    } catch (error) {
      setError(getErrorMessage(error, "Customer status could not be updated."));
    } finally {
      setIsUpdatingStatus(false);
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
    loadCustomer();
  }, [customerId]);

  return (
    <div>
      <div className="mb-8">
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#444748] transition hover:text-[#1c1b1b]"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#444748]">
              CUSTOMER DETAIL
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#1c1b1b]">
              {customer?.name ?? "Customer"}
            </h1>
            <p className="mt-2 text-sm text-[#444748]">
              Order history, account status, and customer value.
            </p>
          </div>

          {customer && (
            <button
              onClick={toggleCustomerStatus}
              disabled={isUpdatingStatus}
              className={[
                "rounded-full px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                customer.isActive
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
              ].join(" ")}
            >
              {isUpdatingStatus
                ? "Updating..."
                : customer.isActive
                  ? "Deactivate Customer"
                  : "Activate Customer"}
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl bg-white p-6 text-sm font-medium text-[#444748]">
          Loading customer...
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {customer && (
        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f7f3f2] text-[#1c1b1b]">
                  <UserRound size={24} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#1c1b1b]">
                    {customer.name}
                  </p>
                  <p className="mt-1 truncate text-sm text-[#747878]">
                    {customer.email}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f3f2] p-4">
                  <PackageCheck size={18} className="text-[#444748]" />
                  <p className="mt-3 text-2xl font-bold text-[#1c1b1b]">
                    {customer.orderCount}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#747878]">
                    Orders
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f3f2] p-4">
                  <Heart size={18} className="text-[#444748]" />
                  <p className="mt-3 text-2xl font-bold text-[#1c1b1b]">
                    {customer.favoriteCount}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#747878]">
                    Favorites
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <h2 className="font-bold text-[#1c1b1b]">Account</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[#444748]">Status</span>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-bold",
                      customer.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700",
                    ].join(" ")}
                  >
                    {customer.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#444748]">Joined</span>
                  <span className="font-medium text-[#1c1b1b]">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#444748]">Total Spent</span>
                  <span className="font-bold text-[#1c1b1b]">
                    ${customer.totalSpent}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#444748]">Last Order</span>
                  <span className="font-medium text-[#1c1b1b]">
                    {customer.lastOrderAt
                      ? new Date(customer.lastOrderAt).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <section className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-[#1c1b1b]">Order History</h2>
                <p className="mt-1 text-sm text-[#444748]">
                  Recent purchases from this customer.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#f1edec]">
              {customer.orders.map((order) => (
                <div key={order.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link
                        to={`/orders/${order.id}`}
                        className="font-bold text-[#1c1b1b] transition hover:text-[#444748]"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                      <p className="mt-1 text-sm text-[#747878]">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <p className="text-sm font-bold text-[#1c1b1b]">
                        ${order.totalAmount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl bg-[#f7f3f2] p-3"
                      >
                        <div className="h-14 w-12 overflow-hidden rounded-xl bg-white">
                          {item.product?.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#747878]">
                              No img
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#1c1b1b]">
                            {item.productName}
                          </p>
                          <p className="mt-1 text-xs font-medium text-[#747878]">
                            {item.quantity} items - ${item.lineTotal}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {customer.orders.length === 0 && (
                <div className="rounded-2xl bg-[#f7f3f2] p-8 text-center text-sm text-[#747878]">
                  No orders found for this customer.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
