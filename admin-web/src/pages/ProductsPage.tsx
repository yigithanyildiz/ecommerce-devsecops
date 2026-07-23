import { useEffect, useState } from "react";
import axios from "axios";
import { RefreshCcw } from "lucide-react";
import { api } from "../api/client";

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  stock: number;
  imageUrl?: string | null;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "",
  imageUrl: "",
  categoryId: "",
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadProducts() {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.get<Product[]>("/admin/products");
      setProducts(response.data);
    } catch (error) {
      setError(getErrorMessage(error, "Products could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const response = await api.get<Category[]>("/admin/categories");
      setCategories(response.data);

      if (response.data[0]) {
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || response.data[0].id,
        }));
      }
    } catch (error) {
      setError(getErrorMessage(error, "Categories could not be loaded."));
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "name" && !current.slug
        ? {
            slug: value
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, ""),
          }
        : {}),
    }));
  }

  function resetForm() {
    setEditingProductId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
  }

  function startEdit(product: Product) {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: product.price,
      stock: String(product.stock),
      imageUrl: product.imageUrl ?? "",
      categoryId: product.category?.id ?? categories[0]?.id ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      price: form.price,
      stock: Number(form.stock),
      imageUrl: form.imageUrl,
      categoryId: form.categoryId,
    };

    try {
      if (editingProductId) {
        await api.patch(`/admin/products/${editingProductId}`, payload);
      } else {
        await api.post("/admin/products", payload);
      }

      resetForm();
      await loadProducts();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          editingProductId
            ? "Product could not be updated."
            : "Product could not be created.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleProductStatus(product: Product) {
    setError("");

    try {
      await api.patch(`/admin/products/${product.id}/status`, {
        isActive: !product.isActive,
      });
      await loadProducts();
    } catch (error) {
      setError(getErrorMessage(error, "Product status could not be updated."));
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

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-[#444748]">
            CATALOG
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#1c1b1b]">Products</h1>
          <p className="mt-2 text-sm text-[#444748]">
            Manage inventory, pricing, and product visibility.
          </p>
        </div>

        <button
          onClick={loadProducts}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1c1b1b] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <form
        onSubmit={saveProduct}
        className="mb-6 rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]"
      >
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#444748]">
            {editingProductId ? "Edit Product" : "New Product"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#1c1b1b]">
            {editingProductId ? "Update catalog item" : "Add catalog item"}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="Name"
            className="rounded-2xl bg-[#f7f3f2] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#1c1b1b]"
            required
          />

          <input
            value={form.slug}
            onChange={(event) => updateForm("slug", event.target.value)}
            placeholder="Slug"
            className="rounded-2xl bg-[#f7f3f2] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#1c1b1b]"
            required
          />

          <input
            value={form.price}
            onChange={(event) => updateForm("price", event.target.value)}
            placeholder="Price"
            className="rounded-2xl bg-[#f7f3f2] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#1c1b1b]"
            required
          />

          <input
            value={form.stock}
            onChange={(event) => updateForm("stock", event.target.value)}
            placeholder="Stock"
            type="number"
            className="rounded-2xl bg-[#f7f3f2] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#1c1b1b]"
            required
          />

          <select
            value={form.categoryId}
            onChange={(event) => updateForm("categoryId", event.target.value)}
            className="rounded-2xl bg-[#f7f3f2] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#1c1b1b]"
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            value={form.imageUrl}
            onChange={(event) => updateForm("imageUrl", event.target.value)}
            placeholder="Image URL"
            className="rounded-2xl bg-[#f7f3f2] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#1c1b1b] xl:col-span-2"
          />

          <input
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder="Description"
            className="rounded-2xl bg-[#f7f3f2] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#1c1b1b] md:col-span-2 xl:col-span-4"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            disabled={isSaving}
            className="rounded-full bg-[#1c1b1b] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : editingProductId
                ? "Update Product"
                : "Create Product"}
          </button>

          {editingProductId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-[#1c1b1b] px-5 py-3 text-sm font-bold text-[#1c1b1b] transition hover:bg-[#f7f3f2]"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {isLoading && (
        <div className="rounded-2xl bg-white p-6 text-sm font-medium text-[#444748]">
          Loading products...
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {!isLoading && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-[#f7f3f2] text-xs uppercase tracking-[0.12em] text-[#444748]">
                <tr>
                  <th className="px-5 py-4 font-bold">Product</th>
                  <th className="px-5 py-4 font-bold">Category</th>
                  <th className="px-5 py-4 font-bold">Price</th>
                  <th className="px-5 py-4 font-bold">Stock</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f1edec]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#fdf8f8]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-12 overflow-hidden rounded-xl bg-[#f7f3f2]">
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

                        <div>
                          <p className="font-semibold text-[#1c1b1b]">
                            {product.name}
                          </p>
                          <p className="mt-1 max-w-md truncate text-xs text-[#747878]">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#444748]">
                      {product.category?.name ?? "-"}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-[#1c1b1b]">
                      ${product.price}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold",
                          product.stock <= 0
                            ? "bg-red-50 text-red-700"
                            : product.stock <= 5
                              ? "bg-yellow-50 text-yellow-800"
                              : "bg-[#f7f3f2] text-[#444748]",
                        ].join(" ")}
                      >
                        {product.stock <= 0
                          ? "Out of stock"
                          : product.stock <= 5
                            ? `Low: ${product.stock}`
                            : product.stock}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleProductStatus(product)}
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold transition",
                          product.isActive
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 hover:bg-red-100",
                        ].join(" ")}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => startEdit(product)}
                        className="rounded-full border border-[#1c1b1b] px-4 py-2 text-xs font-bold text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-[#747878]"
                    >
                      No products found.
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
