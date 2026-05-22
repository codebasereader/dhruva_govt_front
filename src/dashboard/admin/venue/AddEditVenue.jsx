import { useEffect, useState } from "react";
import { createVenue, updateVenue } from "../../../api/venue";
import { getApiErrorMessage } from "../../../api/utils";
import FormField from "../../../components/common/FormField";
import { getEntityId } from "../../../utils/entity";
import { cn } from "../../../utils/cn";

const btnPrimary =
  "cursor-pointer rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50";
const btnSecondary =
  "cursor-pointer rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50";

function AddEditVenue({ venue, onSuccess, onCancel }) {
  const isEdit = Boolean(venue);
  const [name, setName] = useState(venue?.name ?? "");
  const [address, setAddress] = useState(venue?.address ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(venue?.name ?? "");
    setAddress(venue?.address ?? "");
    setError("");
  }, [venue]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Venue name is required.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const payload = { name: name.trim() };
      if (address.trim()) payload.address = address.trim();

      if (isEdit) {
        await updateVenue(getEntityId(venue), payload);
      } else {
        await createVenue(payload);
      }
      onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save venue."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <FormField
        id="venue-name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Venue name"
        required
        disabled={submitting}
      />
      <FormField
        id="venue-address"
        label="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Address (optional)"
        disabled={submitting}
      />

      <footer className="flex gap-3 border-t border-zinc-100 pt-4">
        <button
          type="button"
          className={cn(btnSecondary, "flex-1")}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className={cn(btnPrimary, "flex-1")} disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Update" : "Save"}
        </button>
      </footer>
    </form>
  );
}

export default AddEditVenue;
