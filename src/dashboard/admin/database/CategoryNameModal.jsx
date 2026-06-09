import { useEffect, useState } from "react";
import {
  createDatabaseCategory,
  updateDatabaseCategory,
} from "../../../api/database";
import { getApiErrorMessage } from "../../../api/utils";
import FormField from "../../../components/common/FormField";
import Modal from "../../../components/common/Modal";
import { getEntityId } from "../../../utils/entity";
import { cn } from "../../../utils/cn";

const btnPrimary =
  "cursor-pointer rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50";
const btnSecondary =
  "cursor-pointer rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50";

function CategoryNameModal({ open, category, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setError("");
  }, [open, category]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = { name: name.trim() };
      const saved = isEdit
        ? await updateDatabaseCategory(getEntityId(category), payload)
        : await createDatabaseCategory(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save category."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit category" : "Add category"}
      size="sm"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <FormField
          id="db-category-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          required
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
            {submitting ? "Saving…" : "Submit"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export default CategoryNameModal;
