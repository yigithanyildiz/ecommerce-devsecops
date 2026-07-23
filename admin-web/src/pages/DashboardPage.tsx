import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  PackageCheck,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { api } from "../api/client";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";

type DashboardStats = {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: string;
  lowStockProducts: number;
  outOfStockProducts: number;
  recentOrders: Array<{
    id: string;
    status: string;
    totalAmount: string;
    createdAt: string;
    user?: {
      name: string;
      email: string;
    } | null;
    items: Array<{
      id: string;
    }>;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    slug: string;
    stock: number;
    price: string;
    imageUrl?: string | null;
    category?: {
      name: string;
    } | null;
  }>;
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get<DashboardStats>("/admin/dashboard");
        setStats(response.data);
      } catch {
        setError("Dashboard verileri yüklenemedi.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const formattedRevenue = stats
    ? Number(stats.totalRevenue).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })
    : "0";

  return (
    <div className="w-full">
      <div className="mb-8">
        <p className="text-xs font-bold tracking-[0.22em] text-[#444748]">
          OVERVIEW
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#1c1b1b]">Dashboard</h1>
        <p className="mt-2 text-sm text-[#444748]">
          Store performance and operational summary.
        </p>
      </div>

      {isLoading && (
        <div className="rounded-2xl bg-white p-6 text-sm font-medium text-[#444748]">
          Loading dashboard...
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Products"
              value={stats.totalProducts}
              icon={Boxes}
              helper="Catalog items"
            />
            <StatCard
              title="Orders"
              value={stats.totalOrders}
              icon={PackageCheck}
              helper="Customer orders"
            />
            <StatCard
              title="Revenue"
              value={`$${formattedRevenue}`}
              icon={TrendingUp}
              helper="Order value"
            />
            <StatCard
              title="Low Stock"
              value={stats.lowStockProducts}
              icon={TriangleAlert}
              helper="Stock <= 5"
            />
            <StatCard
              title="Out of Stock"
              value={stats.outOfStockProducts}
              icon={AlertTriangle}
              helper="No stock"
            />
          </div>

          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <section className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1c1b1b]">
                    Recent Orders
                  </h2>
                  <p className="mt-1 text-sm text-[#444748]">
                    Latest customer activity.
                  </p>
                </div>

                <Link
                  to="/orders"
                  className="rounded-full border border-[#1c1b1b] px-4 py-2 text-xs font-bold text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
                >
                  View all
                </Link>
              </div>

              <div className="divide-y divide-[#f1edec]">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[1fr_auto_auto] md:items-center"
                  >
                    <div>
                      <Link
                        to={`/orders/${order.id}`}
                        className="font-semibold text-[#1c1b1b] transition hover:opacity-70"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                      <p className="mt-1 text-xs text-[#747878]">
                        {order.user?.email ?? "Unknown customer"} ·{" "}
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <StatusBadge status={order.status} />

                    <div className="text-left md:text-right">
                      <p className="text-sm font-bold text-[#1c1b1b]">
                        ${order.totalAmount}
                      </p>
                      <p className="mt-1 text-xs text-[#747878]">
                        {order.items.length} items
                      </p>
                    </div>
                  </div>
                ))}

                {stats.recentOrders.length === 0 && (
                  <div className="py-8 text-center text-sm text-[#747878]">
                    No orders yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1c1b1b]">
                    Low Stock
                  </h2>
                  <p className="mt-1 text-sm text-[#444748]">
                    Products that need attention.
                  </p>
                </div>

                <Link
                  to="/products"
                  className="rounded-full border border-[#1c1b1b] px-4 py-2 text-xs font-bold text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
                >
                  Manage
                </Link>
              </div>

              <div className="space-y-3">
                {stats.lowStockItems.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-2xl bg-[#f7f3f2] p-3"
                  >
                    <div className="h-14 w-12 overflow-hidden rounded-xl bg-white">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[#747878]">
                          No img
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#1c1b1b]">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-[#747878]">
                        {product.category?.name ?? "Uncategorized"}
                      </p>
                    </div>

                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-bold",
                        product.stock <= 0
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-800",
                      ].join(" ")}
                    >
                      {product.stock <= 0 ? "Out" : product.stock}
                    </span>
                  </div>
                ))}

                {stats.lowStockItems.length === 0 && (
                  <div className="rounded-2xl bg-[#f7f3f2] p-6 text-center text-sm text-[#747878]">
                    Stock levels look healthy.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
