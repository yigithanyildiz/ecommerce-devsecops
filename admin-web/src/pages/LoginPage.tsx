import { useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (error) {
      setError(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function getLoginErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;

      if (message === "Account is inactive") {
        return "Bu hesap pasif durumda. Admin erişimi kapatılmış.";
      }
    }

    return "Giriş başarısız. E-posta veya şifreyi kontrol et.";
  }

  return (
    <main className="min-h-screen bg-[#fdf8f8] px-5 py-8 text-[#1c1b1b]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="hidden overflow-hidden rounded-3xl bg-[#1c1b1b] p-10 text-white shadow-[0_20px_60px_rgba(26,26,26,0.16)] lg:block">
            <p className="text-xs font-bold tracking-[0.26em] text-white/60">
              LUXECART ADMIN
            </p>
            <h1 className="mt-6 max-w-xl text-5xl font-bold leading-tight">
              Premium commerce operations, quietly organized.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
              Manage products, orders, inventory, and categories from one clean
              operational dashboard.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-4">
              {["Products", "Orders", "Revenue"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-sm font-semibold">{item}</p>
                  <p className="mt-2 text-xs text-white/55">Live controls</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(26,26,26,0.08)]">
            <p className="text-xs font-bold tracking-[0.24em] text-[#444748]">
              LUXECART
            </p>
            <h2 className="mt-3 text-3xl font-bold">Admin Login</h2>
            <p className="mt-2 text-sm leading-6 text-[#444748]">
              Sign in with an admin account to manage the store.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl bg-[#f7f3f2] px-4 py-3 text-sm outline-none ring-1 ring-transparent transition focus:ring-[#1c1b1b]"
                  type="email"
                  autoComplete="email"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Password</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl bg-[#f7f3f2] px-4 py-3 text-sm outline-none ring-1 ring-transparent transition focus:ring-[#1c1b1b]"
                  type="password"
                  autoComplete="current-password"
                />
              </label>

              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <button
                disabled={isSubmitting}
                className="w-full rounded-full bg-[#1c1b1b] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
