import {
  BarChart3,
  Boxes,
  FolderTree,
  LogOut,
  PackageCheck,
  UsersRound,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  {
    label: "Dashboard",
    to: "/",
    icon: BarChart3,
  },
  {
    label: "Products",
    to: "/products",
    icon: Boxes,
  },
  {
    label: "Orders",
    to: "/orders",
    icon: PackageCheck,
  },
  {
    label: "Customers",
    to: "/customers",
    icon: UsersRound,
  },
  {
    label: "Categories",
    to: "/categories",
    icon: FolderTree,
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-[#1c1b1b]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#e5e2e1] bg-white/80 px-5 py-6 shadow-[0_12px_40px_rgba(26,26,26,0.06)] backdrop-blur lg:block">
        <div className="mb-10">
          <p className="text-xs font-bold tracking-[0.24em] text-[#444748]">
            LUXECART
          </p>
          <h1 className="mt-2 text-2xl font-bold">Admin</h1>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-[#1c1b1b] text-white"
                      : "text-[#444748] hover:bg-[#f7f3f2] hover:text-[#1c1b1b]",
                  ].join(" ")
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-2xl bg-[#f7f3f2] p-4">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="mt-1 truncate text-xs text-[#444748]">{user?.email}</p>

          <button
            onClick={logout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#1c1b1b] px-4 py-2 text-sm font-semibold text-[#1c1b1b] transition hover:bg-white"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#e5e2e1] bg-[#fdf8f8]/85 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-[#444748]">
                LUXECART
              </p>
              <h2 className="text-xl font-bold">Admin Panel</h2>
            </div>

            <div className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#444748] shadow-[0_4px_20px_rgba(26,26,26,0.04)] sm:block">
              {user?.role}
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    [
                      "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                      isActive
                        ? "bg-[#1c1b1b] text-white"
                        : "bg-white text-[#444748]",
                    ].join(" ")
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </header>

        <main className="w-full min-w-0 px-5 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
