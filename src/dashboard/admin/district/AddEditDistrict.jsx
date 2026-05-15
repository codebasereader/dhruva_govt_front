import { useState } from "react";
import { createDistrict, updateDistrict } from "../../../api/district";
import { getApiErrorMessage } from "../../../api/utils";
import FormField from "../../../components/common/FormField";
import { getEntityId } from "../../../utils/entity";
import { cn } from "../../../utils/cn";

const btnPrimary =
  "cursor-pointer rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50";
const btnSecondary =
  "cursor-pointer rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50";

function AddEditDistrict({ district, onSuccess, onCancel }) {
  const isEdit = Boolean(district);
  const [name, setName] = useState(district?.name ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = { name: name.trim() };
      if (isEdit) {
        await updateDistrict(getEntityId(district), payload);
      } else {
        await createDistrict(payload);
      }
      onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save district."));
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
          id="district-name"
          label="District name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter district name"
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

export default AddEditDistrict;
