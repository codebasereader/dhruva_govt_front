import { useState } from "react";
import { createVenue } from "../../../api/venue";
import { getApiErrorMessage } from "../../../api/utils";
import FormField from "../../../components/common/FormField";
import Modal from "../../../components/common/Modal";
import { getEntityId } from "../../../utils/entity";
import { cn } from "../../../utils/cn";

const btnPrimary =
  "cursor-pointer rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50";
const btnSecondary =
  "cursor-pointer rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50";

function AddVenueModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (submitting) return;
    setName("");
    setAddress("");
    setError("");
    onClose();
  };

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

      const created = await createVenue(payload);
      onCreated(getEntityId(created));
      setName("");
      setAddress("");
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save venue."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add venue" size="sm">
      <form className="space-y-4" onSubmit={handleSubmit}>
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

        <footer className="flex gap-3 pt-2">
          <button
            type="button"
            className={cn(btnSecondary, "flex-1")}
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className={cn(btnPrimary, "flex-1")} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export default AddVenueModal;
