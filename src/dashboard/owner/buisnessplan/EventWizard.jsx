import { useEffect, useState } from "react";
import { getDepartments } from "../../../api/department";
import { getDistricts } from "../../../api/district";
import {
  createBusinessPlanEvent,
  deleteBusinessPlanEvent,
  updateBusinessPlanEvent,
} from "../../../api/buisnessplan";
import { getApiErrorMessage } from "../../../api/utils";
import {
  BELONGS_TO,
  EVENT_TYPE_OPTIONS,
  EVENT_TYPES,
} from "../../../constants/businessPlan";
import FormField from "../../../components/common/FormField";
import SearchableSelect from "../../../components/common/SearchableSelect";
import { buildEventPayload, normalizeBusinessPlanEvent } from "../../../utils/businessPlanEvent";
import { cn } from "../../../utils/cn";
import { getEntityId } from "../../../utils/entity";

const STEPS = [
  { id: 1, title: "Event details" },
  { id: 2, title: "Belongs to" },
  { id: 3, title: "Location" },
  { id: 4, title: "Event type" },
  { id: 5, title: "Review" },
];

const emptyForm = (date) => ({
  eventName: "",
  date: date ?? "",
  belongsTo: BELONGS_TO.DISTRICT,
  districtId: "",
  departmentId: "",
  eventType: EVENT_TYPES.MCA,
});

function buildInitialForm(event, defaultDate) {
  if (event) {
    const n = normalizeBusinessPlanEvent(event);
    return {
      eventName: n.eventName,
      date: n.date,
      belongsTo: n.belongsTo || BELONGS_TO.DISTRICT,
      districtId: n.districtId,
      departmentId: n.departmentId,
      eventType: n.eventType || EVENT_TYPES.MCA,
    };
  }
  return emptyForm(defaultDate);
}

function EventWizard({ event, defaultDate, onClose, onSaved }) {
  const isEdit = Boolean(event?.id);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => buildInitialForm(event, defaultDate));
  const [districts, setDistricts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingOptions(true);
      try {
        const [d, dept] = await Promise.all([getDistricts(), getDepartments()]);
        if (active) {
          setDistricts(d);
          setDepartments(dept);
        }
      } catch {
        if (active) setError("Failed to load districts or departments.");
      } finally {
        if (active) setLoadingOptions(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canNext = () => {
    if (step === 1) return form.eventName.trim() && form.date;
    if (step === 2) return form.belongsTo;
    if (step === 3) {
      if (form.belongsTo === BELONGS_TO.DISTRICT) return Boolean(form.districtId);
      return Boolean(form.departmentId);
    }
    if (step === 4) return Boolean(form.eventType);
    return true;
  };

  const handleSave = async () => {
    setError("");
    setSubmitting(true);
    try {
      const payload = buildEventPayload(form);
      if (isEdit) {
        await updateBusinessPlanEvent(event.id, payload);
      } else {
        await createBusinessPlanEvent(payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save event."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !window.confirm("Delete this event?")) return;
    setDeleting(true);
    setError("");
    try {
      await deleteBusinessPlanEvent(event.id);
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete event."));
    } finally {
      setDeleting(false);
    }
  };

  const districtLabel =
    districts.find((d) => getEntityId(d) === form.districtId)?.name ?? "—";
  const departmentLabel =
    departments.find((d) => getEntityId(d) === form.departmentId)?.name ?? "—";
  const typeLabel =
    EVENT_TYPE_OPTIONS.find((o) => o.value === form.eventType)?.label ?? "—";

  return (
    <div className="space-y-6">
      <ol className="flex gap-1">
        {STEPS.map((s) => (
          <li
            key={s.id}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              s.id <= step ? "bg-zinc-900" : "bg-zinc-200",
            )}
            title={s.title}
          />
        ))}
      </ol>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
        Step {step} of {STEPS.length} — {STEPS[step - 1].title}
      </p>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <FormField
            id="bp-name"
            label="Event name"
            value={form.eventName}
            onChange={(e) => setField("eventName", e.target.value)}
            placeholder="e.g. Quarterly review"
            required
          />
          <FormField
            id="bp-date"
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            required
          />
        </div>
      ) : null}

      {step === 2 ? (
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Belongs to
          </legend>
          {[
            { value: BELONGS_TO.DISTRICT, label: "District" },
            { value: BELONGS_TO.DEPARTMENT, label: "Department" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                form.belongsTo === opt.value
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 hover:border-zinc-300",
              )}
            >
              <input
                type="radio"
                name="belongsTo"
                value={opt.value}
                checked={form.belongsTo === opt.value}
                onChange={() => {
                  setField("belongsTo", opt.value);
                  setField("districtId", "");
                  setField("departmentId", "");
                }}
                className="size-4 accent-zinc-900"
              />
              <span className="text-sm font-medium text-zinc-800">{opt.label}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      {step === 3 ? (
        <div>
          {form.belongsTo === BELONGS_TO.DISTRICT ? (
            <SearchableSelect
              id="bp-district"
              label="District"
              value={form.districtId}
              onChange={(value) => setField("districtId", value)}
              placeholder="Choose district…"
              loading={loadingOptions}
              options={districts.map((d) => ({
                value: getEntityId(d),
                label: d.name,
              }))}
              required
            />
          ) : (
            <SearchableSelect
              id="bp-department"
              label="Department"
              value={form.departmentId}
              onChange={(value) => setField("departmentId", value)}
              placeholder="Choose department…"
              loading={loadingOptions}
              options={departments.map((d) => ({
                value: getEntityId(d),
                label: d.name,
              }))}
              required
            />
          )}
        </div>
      ) : null}

      {step === 4 ? (
        <fieldset className="space-y-3">
          <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Event type
          </legend>
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                form.eventType === opt.value
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 hover:border-zinc-300",
              )}
            >
              <input
                type="radio"
                name="eventType"
                value={opt.value}
                checked={form.eventType === opt.value}
                onChange={() => setField("eventType", opt.value)}
                className="size-4 accent-zinc-900"
              />
              <span className="text-sm font-medium text-zinc-800">{opt.label}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      {step === 5 ? (
        <dl className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 text-sm">
          <div>
            <dt className="text-zinc-500">Event</dt>
            <dd className="font-medium text-zinc-900">{form.eventName}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Date</dt>
            <dd className="font-medium text-zinc-900">{form.date}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Belongs to</dt>
            <dd className="font-medium capitalize text-zinc-900">{form.belongsTo}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">
              {form.belongsTo === BELONGS_TO.DISTRICT ? "District" : "Department"}
            </dt>
            <dd className="font-medium text-zinc-900">
              {form.belongsTo === BELONGS_TO.DISTRICT
                ? districtLabel
                : departmentLabel}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Type</dt>
            <dd className="font-medium text-zinc-900">{typeLabel}</dd>
          </div>
        </dl>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
        <div>
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="cursor-pointer text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete event"}
            </button>
          ) : (
            <span />
          )}
        </div>
        <div className="flex gap-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              className="cursor-pointer rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
          )}
          {step < STEPS.length ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="cursor-pointer rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSave}
              className="cursor-pointer rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting ? "Saving…" : isEdit ? "Update" : "Save"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default EventWizard;
