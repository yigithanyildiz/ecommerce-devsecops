import { useEffect, useState } from "react";
import axios from "axios";
import { RefreshCcw, Search, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

type Customer = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
  favoriteCount: number;
  totalSpent: string;
  lastOrderAt?: string | null;
};

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredCustomers = customers.filter((customer) => {
    const searchText = `${customer.name} ${customer.email}`.toLowerCase();
    return searchText.includes(query.toLowerCase().trim());
  });

  async function loadCustomers() {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.get<Customer[]>("/admin/customers");
      setCustomers(response.data);
    } catch (error) {
      setError(getErrorMessage(error, "Customers could not be loaded."));
    } finally {
      setIsLoading(false);
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
    loadCustomers();
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-[#444748]">
            CUSTOMERS
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#1c1b1b]">Customers</h1>
          <p className="mt-2 text-sm text-[#444748]">
            Review customer activity, order volume, and lifetime spend.
          </p>
        </div>

        <button
          onClick={loadCustomers}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1c1b1b] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
          <Search size={18} className="text-[#747878]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            className="w-full bg-transparent text-sm font-medium text-[#1c1b1b] outline-none placeholder:text-[#747878]"
          />
        </label>

        <div className="rounded-2xl bg-white px-5 py-3 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#747878]">
            Total Customers
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1c1b1b]">
            {customers.length}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl bg-white p-6 text-sm font-medium text-[#444748]">
          Loading customers...
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
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-[#f7f3f2] text-xs uppercase tracking-[0.12em] text-[#444748]">
                <tr>
                  <th className="px-5 py-4 font-bold">Customer</th>
                  <th className="px-5 py-4 font-bold">Joined</th>
                  <th className="px-5 py-4 font-bold">Orders</th>
                  <th className="px-5 py-4 font-bold">Favorites</th>
                  <th className="px-5 py-4 font-bold">Total Spent</th>
                  <th className="px-5 py-4 font-bold">Last Order</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f1edec]">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#fdf8f8]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f3f2] text-[#1c1b1b]">
                          <UserRound size={18} />
                        </div>

                        <div>
                          <p className="font-semibold text-[#1c1b1b]">
                            {customer.name}
                          </p>
                          <p className="mt-1 text-xs text-[#747878]">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#444748]">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-[#1c1b1b]">
                      {customer.orderCount}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-[#1c1b1b]">
                      {customer.favoriteCount}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-[#1c1b1b]">
                      ${customer.totalSpent}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#444748]">
                      {customer.lastOrderAt
                        ? new Date(customer.lastOrderAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-5 py-4">
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
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="rounded-full border border-[#1c1b1b] px-4 py-2 text-xs font-bold text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredCustomers.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-sm text-[#747878]"
                    >
                      No customers found.
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
