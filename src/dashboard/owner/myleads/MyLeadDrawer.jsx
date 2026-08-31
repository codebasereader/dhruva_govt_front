import { useEffect, useState } from "react";
import { createMyLead, updateMyLead } from "../../../api/myLeads";
import { getApiErrorMessage } from "../../../api/utils";
import Drawer from "../../../components/common/Drawer";
import FormField from "../../../components/common/FormField";
import { MY_LEAD_MEETING_STATUS_OPTIONS } from "../../../constants/myLeads";
import { cn } from "../../../utils/cn";
import { getEntityId } from "../../../utils/entity";
import {
  buildMyLeadPayload,
  emptyMeetingRow,
  emptyMyLeadForm,
  leadToForm,
} from "../../../utils/myLead";

const btnPrimary =
  "cursor-pointer rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50";
const btnSecondary =
  "cursor-pointer rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50";

function MyLeadDrawer({ open, onClose, lead, onSaved }) {
  const isEdit = Boolean(lead?.id);
  const [form, setForm] = useState(emptyMyLeadForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(leadToForm(lead));
    setError("");
  }, [open, lead]);

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const updateMeeting = (id, key, value) => {
    setForm((prev) => ({
      ...prev,
      meetings: prev.meetings.map((m) =>
        m.id === id ? { ...m, [key]: value } : m,
      ),
    }));
  };

  const addMeeting = () => {
    setForm((prev) => ({
      ...prev,
      meetings: [...prev.meetings, emptyMeetingRow()],
    }));
  };

  const removeMeeting = (id) => {
    setForm((prev) => {
      const next = prev.meetings.filter((m) => m.id !== id);
      return {
        ...prev,
        meetings: next.length > 0 ? next : [emptyMeetingRow()],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.clientName.trim()) {
      setError("Client name is required.");
      return;
    }
    if (!form.phoneNumber.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!form.meetingStatus) {
      setError("Meeting status is required.");
      return;
    }

    const datedMeetings = form.meetings.filter((m) => m.meetingDate);
    if (datedMeetings.length === 0) {
      setError("Add at least one meeting with a date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildMyLeadPayload(form);
      if (isEdit) {
        await updateMyLead(getEntityId(lead), payload);
      } else {
        await createMyLead(payload);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save lead."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit lead" : "Add lead"}
      description="Client details, meeting status, and meeting history."
      size="threeQuarter"
    >
      <form className="flex h-full flex-col" onSubmit={handleSubmit}>
        <div className="flex-1 space-y-6">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="lead-client-name"
              label="Client name"
              value={form.clientName}
              onChange={setField("clientName")}
              placeholder="Client name"
              required
              disabled={submitting}
            />
            <FormField
              id="lead-meeting-status"
              label="Meeting status"
              as="select"
              value={form.meetingStatus}
              onChange={setField("meetingStatus")}
              options={MY_LEAD_MEETING_STATUS_OPTIONS}
              required
              disabled={submitting}
            />
            <FormField
              id="lead-phone"
              label="Phone number"
              type="tel"
              value={form.phoneNumber}
              onChange={setField("phoneNumber")}
              placeholder="Primary phone"
              required
              disabled={submitting}
            />
            <FormField
              id="lead-alt-phone"
              label="Alternative number"
              type="tel"
              value={form.alternativeNumber}
              onChange={setField("alternativeNumber")}
              placeholder="Optional"
              disabled={submitting}
            />
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Meetings</h3>
                <p className="text-xs text-zinc-500">
                  One or more meetings with date and notes.
                </p>
              </div>
              <button
                type="button"
                onClick={addMeeting}
                disabled={submitting}
                className="cursor-pointer rounded-full border border-zinc-200 px-3.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Add meeting
              </button>
            </div>

            <div className="space-y-3">
              {form.meetings.map((meeting, index) => (
                <div
                  key={meeting.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Meeting {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMeeting(meeting.id)}
                      disabled={submitting}
                      className="cursor-pointer text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
                    <FormField
                      id={`meeting-date-${meeting.id}`}
                      label="Meeting date"
                      type="date"
                      value={meeting.meetingDate}
                      onChange={(e) =>
                        updateMeeting(meeting.id, "meetingDate", e.target.value)
                      }
                      disabled={submitting}
                    />
                    <div className="space-y-2">
                      <label
                        htmlFor={`meeting-notes-${meeting.id}`}
                        className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
                      >
                        Meeting notes
                      </label>
                      <textarea
                        id={`meeting-notes-${meeting.id}`}
                        value={meeting.meetingNotes}
                        onChange={(e) =>
                          updateMeeting(
                            meeting.id,
                            "meetingNotes",
                            e.target.value,
                          )
                        }
                        rows={2}
                        placeholder="Notes for this meeting"
                        disabled={submitting}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-400/40 disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="sticky bottom-0 -mx-6 mt-8 flex gap-3 border-t border-zinc-100 bg-white px-6 pt-4">
          <button
            type="button"
            className={cn(btnSecondary, "flex-1")}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={cn(btnPrimary, "flex-1")}
            disabled={submitting}
          >
            {submitting ? "Saving…" : isEdit ? "Update" : "Save"}
          </button>
        </footer>
      </form>
    </Drawer>
  );
}

export default MyLeadDrawer;
