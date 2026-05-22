import { useCallback, useEffect, useMemo, useState } from "react";
import { getDepartments } from "../../../api/department";
import { getDistricts } from "../../../api/district";
import {
  createBusinessPlanEvent,
  deleteBusinessPlanEvent,
  updateBusinessPlanEvent,
} from "../../../api/buisnessplan";
import { getVenues } from "../../../api/venue";
import { getApiErrorMessage } from "../../../api/utils";
import {
  BELONGS_TO,
  EVENT_TYPE_OPTIONS,
  EVENT_TYPES,
  GST_RATES,
  MCA_SURCHARGE_PERCENT,
} from "../../../constants/businessPlan";
import FormField from "../../../components/common/FormField";
import SearchableSelect from "../../../components/common/SearchableSelect";
import { buildEventPayload, normalizeBusinessPlanEvent } from "../../../utils/businessPlanEvent";
import {
  calculateBusinessPlanAmounts,
  formatMoney,
  parseAmountInput,
} from "../../../utils/businessPlanAmounts";
import { cn } from "../../../utils/cn";
import { getEntityId } from "../../../utils/entity";
import AddVenueModal from "./AddVenueModal";

function buildSteps() {
  return [
    { id: "details", title: "Event details" },
    { id: "belongs", title: "Belongs to" },
    { id: "location", title: "Location" },
    { id: "venue", title: "Venue" },
    { id: "type", title: "Event type" },
    { id: "amounts", title: "Amounts" },
    { id: "review", title: "Review" },
  ];
}

const emptyForm = (date) => ({
  eventName: "",
  date: date ?? "",
  belongsTo: BELONGS_TO.DISTRICT,
  districtId: "",
  departmentId: "",
  venueId: "",
  eventType: EVENT_TYPES.MCA,
  previousYearAmount: "",
  currentYearAmount: "",
  gstRate: null,
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
      venueId: n.venueId,
      eventType: n.eventType || EVENT_TYPES.MCA,
      previousYearAmount:
        n.previousYearAmount !== "" && n.previousYearAmount != null
          ? String(n.previousYearAmount)
          : "",
      currentYearAmount:
        n.currentYearAmount !== "" && n.currentYearAmount != null
          ? String(n.currentYearAmount)
          : "",
      gstRate: n.gstRate === 18 ? GST_RATES.EIGHTEEN : n.gstRate === 5 ? GST_RATES.FIVE : null,
    };
  }
  return emptyForm(defaultDate);
}

function belongsToOptions() {
  return [
    { value: BELONGS_TO.DISTRICT, label: "District" },
    { value: BELONGS_TO.DEPARTMENT, label: "Department" },
    { value: BELONGS_TO.BOTH, label: "District & Department" },
  ];
}

function EventWizard({ event, defaultDate, onClose, onSaved }) {
  const isEdit = Boolean(event?.id);
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(() => buildInitialForm(event, defaultDate));
  const [districts, setDistricts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const steps = useMemo(() => buildSteps(), []);
  const isMca = form.eventType === EVENT_TYPES.MCA;
  const step = steps[stepIndex] ?? steps[0];
  const amounts = useMemo(
    () =>
      calculateBusinessPlanAmounts({
        eventType: form.eventType,
        currentYearAmount: form.currentYearAmount,
        gstRate: form.gstRate,
      }),
    [form.eventType, form.currentYearAmount, form.gstRate],
  );

  const loadVenues = useCallback(async () => {
    setLoadingVenues(true);
    try {
      const list = await getVenues();
      setVenues(list);
    } catch {
      setError("Failed to load venues.");
    } finally {
      setLoadingVenues(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingOptions(true);
      setLoadingVenues(true);
      try {
        const [d, dept, venueList] = await Promise.all([
          getDistricts(),
          getDepartments(),
          getVenues(),
        ]);
        if (active) {
          setDistricts(d);
          setDepartments(dept);
          setVenues(venueList);
        }
      } catch {
        if (active) setError("Failed to load form options.");
      } finally {
        if (active) {
          setLoadingOptions(false);
          setLoadingVenues(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const locationReady =
    form.belongsTo === BELONGS_TO.DISTRICT
      ? Boolean(form.districtId)
      : form.belongsTo === BELONGS_TO.DEPARTMENT
        ? Boolean(form.departmentId)
        : Boolean(form.districtId && form.departmentId);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleVenueCreated = async (venueId) => {
    await loadVenues();
    setField("venueId", venueId);
  };

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  const canNext = () => {
    switch (step.id) {
      case "details":
        return form.eventName.trim() && form.date;
      case "belongs":
        return Boolean(form.belongsTo);
      case "location":
        return locationReady;
      case "venue":
        return Boolean(form.venueId);
      case "type":
        return Boolean(form.eventType);
      case "amounts":
        return (
          parseAmountInput(form.currentYearAmount) > 0 &&
          (form.gstRate === GST_RATES.FIVE || form.gstRate === GST_RATES.EIGHTEEN)
        );
      default:
        return true;
    }
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
  const venueLabel =
    venues.find((v) => getEntityId(v) === form.venueId)?.name ??
    venues.find((v) => getEntityId(v) === form.venueId)?.address ??
    "—";
  const typeLabel =
    EVENT_TYPE_OPTIONS.find((o) => o.value === form.eventType)?.label ?? "—";
  const belongsLabel =
    belongsToOptions().find((o) => o.value === form.belongsTo)?.label ?? "—";

  const radioCardClass = (active) =>
    cn(
      "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
      active ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300",
    );

  return (
    <div className="space-y-6">
      <ol className="flex gap-1">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= stepIndex ? "bg-zinc-900" : "bg-zinc-200",
            )}
            title={s.title}
          />
        ))}
      </ol>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
        Step {stepIndex + 1} of {steps.length} — {step.title}
      </p>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {step.id === "details" ? (
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

      {step.id === "belongs" ? (
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Belongs to
          </legend>
          {belongsToOptions().map((opt) => (
            <label key={opt.value} className={radioCardClass(form.belongsTo === opt.value)}>
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

      {step.id === "location" ? (
        <div className="space-y-4">
          {(form.belongsTo === BELONGS_TO.DISTRICT ||
            form.belongsTo === BELONGS_TO.BOTH) && (
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
          )}
          {(form.belongsTo === BELONGS_TO.DEPARTMENT ||
            form.belongsTo === BELONGS_TO.BOTH) && (
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

      {step.id === "venue" ? (
        <SearchableSelect
          id="bp-venue"
          label="Venue"
          value={form.venueId}
          onChange={(value) => setField("venueId", value)}
          placeholder="Choose venue…"
          loading={loadingVenues}
          options={venues.map((v) => {
            const id = getEntityId(v);
            const label = v.name?.trim()
              ? v.address?.trim()
                ? `${v.name} — ${v.address}`
                : v.name
              : v.address?.trim() || `Venue ${id}`;
            return { value: id, label };
          })}
          required
          headerAction={
            <button
              type="button"
              onClick={() => setVenueModalOpen(true)}
              className="cursor-pointer text-xs font-semibold text-zinc-700 underline-offset-2 hover:text-zinc-900 hover:underline"
            >
              Add venue
            </button>
          }
        />
      ) : null}

      {step.id === "type" ? (
        <fieldset className="space-y-3">
          <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Event type
          </legend>
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className={radioCardClass(form.eventType === opt.value)}>
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

      {step.id === "amounts" ? (
        <div className="space-y-5">
          <FormField
            id="bp-prev-amount"
            label="Previous year amount"
            type="number"
            value={form.previousYearAmount}
            onChange={(e) => setField("previousYearAmount", e.target.value)}
            placeholder="0.00"
            required
          />
          <FormField
            id="bp-curr-amount"
            label="Current year amount"
            type="number"
            value={form.currentYearAmount}
            onChange={(e) => setField("currentYearAmount", e.target.value)}
            placeholder="0.00"
            required
          />

          {isMca ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-900">
              <p>
                MCA surcharge ({MCA_SURCHARGE_PERCENT}% on current year):{" "}
                <span className="font-semibold">
                  ₹ {formatMoney(amounts.mcaSurchargeAmount)}
                </span>
              </p>
              <p className="mt-1">
                Amount before GST:{" "}
                <span className="font-semibold">
                  ₹ {formatMoney(amounts.amountBeforeGst)}
                </span>
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-700">
              <p>
                Current year amount:{" "}
                <span className="font-semibold">
                  ₹ {formatMoney(amounts.currentYearAmount)}
                </span>
              </p>
            </div>
          )}

          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              GST
            </legend>
            {[
              { value: GST_RATES.FIVE, label: "5% GST" },
              { value: GST_RATES.EIGHTEEN, label: "18% GST" },
            ].map((opt) => (
              <label key={opt.value} className={radioCardClass(form.gstRate === opt.value)}>
                <input
                  type="radio"
                  name="gstRate"
                  value={opt.value}
                  checked={form.gstRate === opt.value}
                  onChange={() => setField("gstRate", opt.value)}
                  className="size-4 accent-zinc-900"
                />
                <span className="text-sm font-medium text-zinc-800">{opt.label}</span>
              </label>
            ))}
          </fieldset>

          <dl className="space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">
                GST ({amounts.gstPercent}% on{" "}
                {isMca ? "amount before GST" : "current year"})
              </dt>
              <dd className="font-medium text-zinc-900">₹ {formatMoney(amounts.gstAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-zinc-200 pt-2">
              <dt className="font-medium text-zinc-700">Final amount</dt>
              <dd className="text-base font-semibold text-zinc-900">
                ₹ {formatMoney(amounts.finalAmount)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {step.id === "review" ? (
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
            <dd className="font-medium text-zinc-900">{belongsLabel}</dd>
          </div>
          {(form.belongsTo === BELONGS_TO.DISTRICT ||
            form.belongsTo === BELONGS_TO.BOTH) && (
            <div>
              <dt className="text-zinc-500">District</dt>
              <dd className="font-medium text-zinc-900">{districtLabel}</dd>
            </div>
          )}
          {(form.belongsTo === BELONGS_TO.DEPARTMENT ||
            form.belongsTo === BELONGS_TO.BOTH) && (
            <div>
              <dt className="text-zinc-500">Department</dt>
              <dd className="font-medium text-zinc-900">{departmentLabel}</dd>
            </div>
          )}
          <div>
            <dt className="text-zinc-500">Venue</dt>
            <dd className="font-medium text-zinc-900">{venueLabel}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Type</dt>
            <dd className="font-medium text-zinc-900">{typeLabel}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Previous year amount</dt>
            <dd className="font-medium text-zinc-900">
              ₹ {formatMoney(parseAmountInput(form.previousYearAmount))}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Current year amount</dt>
            <dd className="font-medium text-zinc-900">
              ₹ {formatMoney(amounts.currentYearAmount)}
            </dd>
          </div>
          {isMca ? (
            <div>
              <dt className="text-zinc-500">MCA surcharge ({MCA_SURCHARGE_PERCENT}%)</dt>
              <dd className="font-medium text-zinc-900">
                ₹ {formatMoney(amounts.mcaSurchargeAmount)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-zinc-500">
              GST ({amounts.gstPercent}%
              {isMca ? " on amount before GST" : " on current year"})
            </dt>
            <dd className="font-medium text-zinc-900">₹ {formatMoney(amounts.gstAmount)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Final amount</dt>
            <dd className="text-base font-semibold text-zinc-900">
              ₹ {formatMoney(amounts.finalAmount)}
            </dd>
          </div>
        </dl>
      ) : null}

      <AddVenueModal
        open={venueModalOpen}
        onClose={() => setVenueModalOpen(false)}
        onCreated={handleVenueCreated}
      />

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
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
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
          {stepIndex < steps.length - 1 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStepIndex((i) => i + 1)}
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
