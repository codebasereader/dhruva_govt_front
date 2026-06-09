import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createDatabaseEntry,
  deleteDatabaseCategory,
  getDatabaseCategories,
  updateDatabaseEntry,
} from "../../../api/database";
import { getApiErrorMessage } from "../../../api/utils";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Drawer from "../../../components/common/Drawer";
import FormField from "../../../components/common/FormField";
import SearchableSelect from "../../../components/common/SearchableSelect";
import { NAME_PREFIXES } from "../../../constants/database";
import { getEntityId } from "../../../utils/entity";
import {
  buildDatabaseEntryPayload,
  normalizeDatabaseCategory,
  normalizeDatabaseEntry,
} from "../../../utils/database";
import { cn } from "../../../utils/cn";
import CategoryNameModal from "./CategoryNameModal";

const emptyForm = {
  categoryId: "",
  prefix: NAME_PREFIXES[0].value,
  name: "",
  contactNumber1: "",
  contactNumber2: "",
  email: "",
  address: "",
  companyName: "",
  departmentName: "",
  designation: "",
  referredBy: "",
};

const btnPrimary =
  "cursor-pointer rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50";
const btnSecondary =
  "cursor-pointer rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50";

function entryToForm(entry) {
  if (!entry) return { ...emptyForm };
  const n = normalizeDatabaseEntry(entry);
  return {
    categoryId: n.categoryId,
    prefix: n.prefix || NAME_PREFIXES[0].value,
    name: n.name,
    contactNumber1: n.contactNumber1,
    contactNumber2: n.contactNumber2,
    email: n.email,
    address: n.address,
    companyName: n.companyName,
    departmentName: n.departmentName,
    designation: n.designation,
    referredBy: n.referredBy,
  };
}

function DatabaseEntryDrawer({ open, onClose, entry, onSaved }) {
  const isEdit = Boolean(entry?.id);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const list = await getDatabaseCategories();
      setCategories(list.map(normalizeDatabaseCategory));
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setForm(entryToForm(entry));
    setError("");
    void loadCategories();
  }, [open, entry, loadCategories]);

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [categories],
  );

  const handleCategorySaved = (saved) => {
    const normalized = normalizeDatabaseCategory(saved);
    setCategories((prev) => {
      const id = normalized.id;
      const exists = prev.some((c) => c.id === id);
      if (exists) {
        return prev.map((c) => (c.id === id ? normalized : c));
      }
      return [...prev, normalized];
    });
    setField("categoryId", normalized.id);
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    setDeletingCategory(true);
    try {
      await deleteDatabaseCategory(deleteCategoryTarget.value);
      setCategories((prev) => prev.filter((c) => c.id !== deleteCategoryTarget.value));
      if (form.categoryId === deleteCategoryTarget.value) {
        setField("categoryId", "");
      }
      setDeleteCategoryTarget(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete category."));
      setDeleteCategoryTarget(null);
    } finally {
      setDeletingCategory(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.contactNumber1.trim()) {
      setError("Contact number 1 is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = buildDatabaseEntryPayload(form);
      if (isEdit) {
        await updateDatabaseEntry(getEntityId(entry), payload);
      } else {
        await createDatabaseEntry(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save entry."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={isEdit ? "Edit entry" : "Add entry"}
        description="Contact details for the database."
        size="panel"
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <SearchableSelect
            id="db-entry-category"
            label="Category"
            value={form.categoryId}
            onChange={(value) => setField("categoryId", value)}
            options={categoryOptions}
            placeholder="Select category"
            required
            disabled={submitting}
            loading={loadingCategories}
            headerAction={
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryModalOpen(true);
                }}
                className="cursor-pointer text-xs font-medium text-emerald-700 hover:text-emerald-900"
              >
                Add
              </button>
            }
            onEditOption={(opt) => {
              const cat = categories.find((c) => c.id === opt.value);
              if (cat) {
                setEditingCategory(cat);
                setCategoryModalOpen(true);
              }
            }}
            onDeleteOption={(opt) => setDeleteCategoryTarget(opt)}
          />

          <div className="space-y-2">
            <label
              htmlFor="db-entry-name"
              className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Name<span className="text-red-400"> *</span>
            </label>
            <div className="flex gap-2">
              <select
                id="db-entry-prefix"
                value={form.prefix}
                onChange={(e) => setField("prefix", e.target.value)}
                disabled={submitting}
                required
                aria-label="Name prefix"
                className="w-[6.75rem] shrink-0 cursor-pointer rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-400/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {NAME_PREFIXES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                id="db-entry-name"
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Full name"
                required
                disabled={submitting}
                className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-400/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <FormField
            id="db-entry-contact1"
            label="Contact number 1"
            type="tel"
            value={form.contactNumber1}
            onChange={(e) => setField("contactNumber1", e.target.value)}
            placeholder="Phone number"
            required
            disabled={submitting}
          />

          <FormField
            id="db-entry-contact2"
            label="Contact number 2"
            type="tel"
            value={form.contactNumber2}
            onChange={(e) => setField("contactNumber2", e.target.value)}
            placeholder="Optional second number"
            disabled={submitting}
          />

          <FormField
            id="db-entry-email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="email@example.com"
            disabled={submitting}
          />

          <FormField
            id="db-entry-address"
            label="Address"
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="Full address"
            disabled={submitting}
          />

          <FormField
            id="db-entry-company"
            label="Company name"
            value={form.companyName}
            onChange={(e) => setField("companyName", e.target.value)}
            placeholder="Company or organization"
            disabled={submitting}
          />

          <FormField
            id="db-entry-department"
            label="Department name"
            value={form.departmentName}
            onChange={(e) => setField("departmentName", e.target.value)}
            placeholder="Department"
            disabled={submitting}
          />

          <FormField
            id="db-entry-designation"
            label="Designation"
            value={form.designation}
            onChange={(e) => setField("designation", e.target.value)}
            placeholder="Role or title"
            disabled={submitting}
          />

          <FormField
            id="db-entry-referred"
            label="Referred by"
            value={form.referredBy}
            onChange={(e) => setField("referredBy", e.target.value)}
            placeholder="Referrer name or reference"
            disabled={submitting}
          />

          <footer className="flex gap-3 border-t border-zinc-100 pt-4">
            <button
              type="button"
              className={cn(btnSecondary, "flex-1")}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className={cn(btnPrimary, "flex-1")} disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Update" : "Save"}
            </button>
          </footer>
        </form>
      </Drawer>

      <CategoryNameModal
        open={categoryModalOpen}
        category={editingCategory}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSaved={handleCategorySaved}
      />

      <ConfirmDialog
        open={Boolean(deleteCategoryTarget)}
        title="Delete category"
        message={`Delete "${deleteCategoryTarget?.label}"? Entries using this category may be affected.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteCategoryTarget(null)}
        loading={deletingCategory}
      />
    </>
  );
}

export default DatabaseEntryDrawer;
