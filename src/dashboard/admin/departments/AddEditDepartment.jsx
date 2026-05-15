import { useState } from "react";
import { createDepartment, updateDepartment } from "../../../api/department";
import { getApiErrorMessage } from "../../../api/utils";
import FormField from "../../../components/common/FormField";
import { getEntityId } from "../../../utils/entity";
import { cn } from "../../../utils/cn";

const btnPrimary =
  "cursor-pointer rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50";
const btnSecondary =
  "cursor-pointer rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50";

function AddEditDepartment({ department, onSuccess, onCancel }) {
  const isEdit = Boolean(department);
  const [name, setName] = useState(department?.name ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = { name: name.trim() };
      if (isEdit) {
        await updateDepartment(getEntityId(department), payload);
      } else {
        await createDepartment(payload);
      }
      onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save department."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <div className="flex-1 space-y-5">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <FormField
          id="department-name"
          label="Department name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter department name"
          required
          disabled={submitting}
        />
      </div>

      <footer className="mt-8 flex gap-3 border-t border-zinc-100 pt-6">
        <button
          type="button"
          className={cn(btnSecondary, "flex-1")}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={cn(btnPrimary, "flex-1")}
          disabled={submitting}
        >
          {submitting ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
      </footer>
    </form>
  );
}

export default AddEditDepartment;
