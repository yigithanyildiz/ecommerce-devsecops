import { useEffect, useState } from "react";
import axios from "axios";
import { FolderTree, RefreshCcw } from "lucide-react";
import { api } from "../api/client";

type Category = {
  id: string;
  name: string;
  slug: string;
  _count?: {
    products: number;
  };
};

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );

  async function loadCategories() {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.get<Category[]>("/admin/categories");
      setCategories(response.data);
    } catch (error) {
      setError(getErrorMessage(error, "Categories could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function updateForm(field: "name" | "slug", value: string) {
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
    setEditingCategoryId(null);
    setForm({
      name: "",
      slug: "",
    });
  }

  function startEdit(category: Category) {
    setError("");
    setEditingCategoryId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
    });
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSaving(true);

    try {
      if (editingCategoryId) {
        await api.patch(`/admin/categories/${editingCategoryId}`, form);
      } else {
        await api.post("/admin/categories", form);
      }

      resetForm();
      await loadCategories();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          editingCategoryId
            ? "Category could not be updated."
            : "Category could not be created.",
        ),
      );
    } finally {
      setIsSaving(false);
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
            CATALOG STRUCTURE
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#1c1b1b]">
            Categories
          </h1>
          <p className="mt-2 text-sm text-[#444748]">
            Organize your product catalog into clear shopping paths.
          </p>
        </div>

        <button
          onClick={loadCategories}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1c1b1b] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <form
        onSubmit={saveCategory}
        className="mb-6 rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]"
      >
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#444748]">
            {editingCategoryId ? "Edit Category" : "New Category"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#1c1b1b]">
            {editingCategoryId ? "Update shopping path" : "Add shopping path"}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
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

          <div className="flex gap-3">
            {editingCategoryId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full bg-[#f7f3f2] px-5 py-3 text-sm font-bold text-[#1c1b1b] transition hover:bg-[#ece6e4]"
              >
                Cancel
              </button>
            )}

            <button
              disabled={isSaving}
              className="rounded-full bg-[#1c1b1b] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : editingCategoryId
                  ? "Save Changes"
                  : "Create Category"}
            </button>
          </div>
        </div>
      </form>

      {isLoading && (
        <div className="rounded-2xl bg-white p-6 text-sm font-medium text-[#444748]">
          Loading categories...
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1c1b1b]">
                    {category.name}
                  </h2>
                  <p className="mt-1 text-sm text-[#747878]">
                    {category.slug}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f3f2] text-[#1c1b1b]">
                  <FolderTree size={20} />
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#f7f3f2] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#444748]">
                  Products
                </p>
                <p className="mt-1 text-2xl font-bold text-[#1c1b1b]">
                  {category._count?.products ?? 0}
                </p>
              </div>

              <button
                onClick={() => startEdit(category)}
                className="mt-4 w-full rounded-full bg-[#1c1b1b] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                Edit Category
              </button>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#747878] md:col-span-2 xl:col-span-3">
              No categories found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
