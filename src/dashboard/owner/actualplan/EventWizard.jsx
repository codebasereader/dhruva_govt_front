import { useCallback, useEffect, useMemo, useState } from "react";
import { getDepartments } from "../../../api/department";
import { getDistricts } from "../../../api/district";
import {
  createActualPlanEvent,
  deleteActualPlanEvent,
  updateActualPlanEvent,
} from "../../../api/actualplan";
import { getVenues } from "../../../api/venue";
import { getApiErrorMessage } from "../../../api/utils";
import {
  BELONGS_TO,
  EVENT_TYPE_OPTIONS,
  EVENT_TYPES,
  GST_RATES,
  MCA_SURCHARGE_PERCENT,
  RECURRENCE_OPTIONS,
  RECURRENCE_TYPES,
} from "../../../constants/businessPlan";
import FormField from "../../../components/common/FormField";
import IndianAmountField from "../../../components/common/IndianAmountField";
import SearchableSelect from "../../../components/common/SearchableSelect";
import {
  buildEventPayload,
  emptyYearAmountFields,
  getAnchorYearFromDate,
  mergeActiveYearIntoYearlyAmounts,
  normalizeBusinessPlanEvent,
  yearAmountFieldsFromSlice,
} from "../../../utils/businessPlanEvent";
import {
  calculateBusinessPlanAmounts,
  formatMoney,
  isEnteredAmount,
  parseAmountInput,
} from "../../../utils/businessPlanAmounts";
import { cn } from "../../../utils/cn";
import { getEntityId } from "../../../utils/entity";
import AddVenueModal from "./AddVenueModal";

function buildSteps() {
  return [
    { id: "details", title: "Event details" },
    { id: "recurrence", title: "Recurrence" },
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
  startDate: date ?? "",
  endDate: date ?? "",
  recurrenceType: RECURRENCE_TYPES.ONE_TIME,
  recurrenceEndDate: "",
  belongsTo: BELONGS_TO.DISTRICT,
  districtId: "",
  departmentId: "",
  venueId: "",
  eventType: EVENT_TYPES.MCA,
  previousYearAmount: "",
  referredBy: "",
  currentYearAmount: "",
  gstRate: null,
  yearlyAmounts: [],
  activeAmountYear: null,
});

function stepIndexForId(steps, stepId) {
  if (!stepId) return 0;
  const index = steps.findIndex((s) => s.id === stepId);
  return index >= 0 ? index : 0;
}

function buildInitialForm(event, defaultDate, defaultAmountYear) {
  if (event) {
    const n = normalizeBusinessPlanEvent(event);
    const anchorYear = getAnchorYearFromDate(n.startDate) ?? new Date().getFullYear();
    const isYearly = n.recurrenceType === RECURRENCE_TYPES.YEARLY;
    const targetYear = defaultAmountYear ?? anchorYear;
    const slice = isYearly ? n.yearlyAmounts.find((y) => y.year === targetYear) : null;
    const amountFields = isYearly
      ? yearAmountFieldsFromSlice(slice)
      : {
          previousYearAmount:
            n.previousYearAmount != null && n.previousYearAmount !== ""
              ? String(Math.round(Number(n.previousYearAmount)))
              : "",
          referredBy: n.referredBy ?? "",
          currentYearAmount:
            n.currentYearAmount != null && n.currentYearAmount !== ""
              ? String(Math.round(Number(n.currentYearAmount)))
              : "",
          gstRate:
            n.gstRate === 18 ? GST_RATES.EIGHTEEN : n.gstRate === 5 ? GST_RATES.FIVE : null,
        };

    return {
      eventName: n.eventName,
      startDate: n.startDate || n.date,
      endDate: n.endDate || n.startDate || n.date,
      recurrenceType: n.recurrenceType || RECURRENCE_TYPES.ONE_TIME,
      recurrenceEndDate: n.recurrenceEndDate || "",
      belongsTo: n.belongsTo || BELONGS_TO.DISTRICT,
      districtId: n.districtId,
      departmentId: n.departmentId,
      venueId: n.venueId,
      eventType: n.eventType || EVENT_TYPES.MCA,
      yearlyAmounts: n.yearlyAmounts ?? [],
      activeAmountYear: isYearly ? targetYear : null,
      ...amountFields,
    };
  }
  const base = emptyForm(defaultDate);
  const anchorYear = getAnchorYearFromDate(defaultDate);
  return {
    ...base,
    activeAmountYear: defaultAmountYear ?? anchorYear ?? null,
  };
}

function belongsToOptions() {
  return [
    { value: BELONGS_TO.DISTRICT, label: "District" },
    { value: BELONGS_TO.DEPARTMENT, label: "Department" },
    { value: BELONGS_TO.BOTH, label: "District & Department" },
  ];
}

function EventWizard({ event, defaultDate, defaultAmountYear, initialStepId, onClose, onSaved }) {
  const isEdit = Boolean(event?.id);
  const steps = useMemo(() => buildSteps(), []);
  const [stepIndex, setStepIndex] = useState(() => stepIndexForId(steps, initialStepId));
  const [form, setForm] = useState(() =>
    buildInitialForm(event, defaultDate, defaultAmountYear),
  );
  const [districts, setDistricts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isMca = form.eventType === EVENT_TYPES.MCA;
  const isYearlyRecurring = form.recurrenceType === RECURRENCE_TYPES.YEARLY;
  const anchorYear =
    getAnchorYearFromDate(form.startDate) ?? new Date().getFullYear();
  const activeAmountYear = form.activeAmountYear ?? anchorYear;

  const configuredYears = useMemo(() => {
    const years = new Set((form.yearlyAmounts ?? []).map((y) => y.year));
    if (isYearlyRecurring) years.add(activeAmountYear);
    return [...years].sort((a, b) => a - b);
  }, [form.yearlyAmounts, activeAmountYear, isYearlyRecurring]);

  const reviewYearlyAmounts = useMemo(() => {
    if (!isYearlyRecurring) return [];
    return mergeActiveYearIntoYearlyAmounts(
      { ...form, activeAmountYear },
      activeAmountYear,
    );
  }, [form, isYearlyRecurring, activeAmountYear]);
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

  const switchAmountYear = (newYear) => {
    setForm((prev) => {
      const currentYear = prev.activeAmountYear ?? anchorYear;
      const withSaved = isYearlyRecurring
        ? { ...prev, yearlyAmounts: mergeActiveYearIntoYearlyAmounts(prev, currentYear) }
        : prev;
      const slice = withSaved.yearlyAmounts.find((y) => y.year === newYear);
      return {
        ...withSaved,
        activeAmountYear: newYear,
        ...yearAmountFieldsFromSlice(slice),
      };
    });
  };

  const addAmountYear = () => {
    setForm((prev) => {
      const currentYear = prev.activeAmountYear ?? anchorYear;
      const withSaved = {
        ...prev,
        yearlyAmounts: mergeActiveYearIntoYearlyAmounts(prev, currentYear),
      };
      const years = withSaved.yearlyAmounts.map((y) => y.year);
      const nextYear = years.length ? Math.max(...years) + 1 : anchorYear;
      return {
        ...withSaved,
        activeAmountYear: nextYear,
        ...emptyYearAmountFields(),
      };
    });
  };

  const deleteActiveAmountYear = (yearToDelete) => {
    const targetYear = yearToDelete ?? activeAmountYear;
    if (!window.confirm(`Delete year ${targetYear} amounts?`)) return;

    setForm((prev) => {
      const saved = mergeActiveYearIntoYearlyAmounts(prev, prev.activeAmountYear ?? anchorYear);
      const remaining = saved.filter((y) => y.year !== targetYear);
      const nextActiveYear =
        remaining.find((y) => y.year > targetYear)?.year ??
        remaining.at(-1)?.year ??
        null;

      if (nextActiveYear == null) {
        return {
          ...prev,
          yearlyAmounts: [],
          activeAmountYear: anchorYear,
          ...emptyYearAmountFields(),
        };
      }

      const nextSlice = remaining.find((y) => y.year === nextActiveYear);
      return {
        ...prev,
        yearlyAmounts: remaining,
        activeAmountYear: nextActiveYear,
        ...yearAmountFieldsFromSlice(nextSlice),
      };
    });
  };

  const handleVenueCreated = async (venueId) => {
    await loadVenues();
    setField("venueId", venueId);
  };

  useEffect(() => {
    setForm(buildInitialForm(event, defaultDate, defaultAmountYear));
    setStepIndex(stepIndexForId(steps, initialStepId));
  }, [event, defaultDate, defaultAmountYear, initialStepId, steps]);

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  const canNext = () => {
    switch (step.id) {
      case "details":
        return (
          form.eventName.trim() &&
          Boolean(form.startDate) &&
          Boolean(form.endDate) &&
          // YYYY-MM-DD strings can be compared lexicographically.
          String(form.endDate) >= String(form.startDate)
        );
      case "recurrence":
        return (
          form.recurrenceType === RECURRENCE_TYPES.ONE_TIME ||
          !form.recurrenceEndDate ||
          String(form.recurrenceEndDate) >= String(form.endDate)
        );
      case "belongs":
        return Boolean(form.belongsTo);
      case "location":
        return locationReady;
      case "venue":
        return Boolean(form.venueId);
      case "type":
        return Boolean(form.eventType);
      case "amounts": {
        if (isYearlyRecurring && isEdit) {
          const merged = mergeActiveYearIntoYearlyAmounts(
            { ...form, activeAmountYear },
            activeAmountYear,
          );
          return merged.length > 0 && merged.every(
            (y) =>
              y.previousYearAmount != null &&
              y.currentYearAmount != null &&
              (y.gstRate === GST_RATES.FIVE || y.gstRate === GST_RATES.EIGHTEEN),
          );
        }
        return (
          isEnteredAmount(form.previousYearAmount) &&
          isEnteredAmount(form.currentYearAmount) &&
          (form.gstRate === GST_RATES.FIVE || form.gstRate === GST_RATES.EIGHTEEN)
        );
      }
      default:
        return true;
    }
  };

  const handleSave = async () => {
    setError("");
    setSubmitting(true);
    try {
      const payload = buildEventPayload({
        ...form,
        activeAmountYear: isYearlyRecurring ? activeAmountYear : null,
      });
      if (isEdit) {
        await updateActualPlanEvent(event.id, payload);
      } else {
        await createActualPlanEvent(payload);
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
      await deleteActualPlanEvent(event.id);
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
  const recurrenceLabel =
    form.recurrenceType === RECURRENCE_TYPES.YEARLY ? "Recurring yearly" : "One-time";

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
            id="bp-start-date"
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(e) => setField("startDate", e.target.value)}
            required
          />
          <FormField
            id="bp-end-date"
            label="End date"
            type="date"
            value={form.endDate}
            onChange={(e) => setField("endDate", e.target.value)}
            required
          />
        </div>
      ) : null}

      {step.id === "recurrence" ? (
        <div className="space-y-4">
          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Event schedule
            </legend>
            {RECURRENCE_OPTIONS.map((opt) => (
              <label key={opt.value} className={radioCardClass(form.recurrenceType === opt.value)}>
                <input
                  type="radio"
                  name="recurrenceType"
                  value={opt.value}
                  checked={form.recurrenceType === opt.value}
                  onChange={() => {
                    setField("recurrenceType", opt.value);
                    if (opt.value === RECURRENCE_TYPES.ONE_TIME) {
                      setField("recurrenceEndDate", "");
                    }
                  }}
                  className="size-4 accent-zinc-900"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-800">{opt.label}</span>
                  <p className="text-xs text-zinc-500">
                    {opt.value === RECURRENCE_TYPES.ONE_TIME
                      ? "Show only for selected date range."
                      : "Show in the same month/date in future years."}
                  </p>
                </div>
              </label>
            ))}
          </fieldset>

          {form.recurrenceType === RECURRENCE_TYPES.YEARLY ? (
            <FormField
              id="bp-recurrence-end-date"
              label="Repeat until (optional)"
              type="date"
              value={form.recurrenceEndDate}
              onChange={(e) => setField("recurrenceEndDate", e.target.value)}
            >
              <p className="text-xs text-zinc-500">Leave empty to continue every year.</p>
            </FormField>
          ) : null}
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
          {isYearlyRecurring ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Amounts for calendar year
              </p>
              {isEdit ? (
                <div className="flex flex-wrap items-center gap-2">
                  {configuredYears.map((y) => {
                    const isActive = activeAmountYear === y;
                    return (
                      <span
                        key={y}
                        className={cn(
                          "inline-flex items-center overflow-hidden rounded-full border text-sm font-medium",
                          isActive
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 text-zinc-600",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => switchAmountYear(y)}
                          className={cn(
                            "cursor-pointer px-3 py-1.5 transition-colors",
                            isActive ? "text-white" : "hover:bg-zinc-50",
                          )}
                        >
                          {y}
                        </button>
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => deleteActiveAmountYear(y)}
                            className="cursor-pointer border-l border-zinc-700 px-2 py-1.5 text-white/90 hover:bg-red-600 hover:text-white"
                            aria-label={`Delete year ${y}`}
                            title={`Delete year ${y}`}
                          >
                            ×
                          </button>
                        ) : null}
                      </span>
                    );
                  })}
                  <button
                    type="button"
                    onClick={addAmountYear}
                    className="cursor-pointer rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                  >
                    + Add year
                  </button>
                </div>
              ) : (
                <p className="text-sm text-zinc-600">
                  Anchor year: <span className="font-semibold text-zinc-900">{anchorYear}</span>
                  {" "}
                  (from start date). You can add more years when editing this event.
                </p>
              )}
            </div>
          ) : null}

          <IndianAmountField
            id="bp-prev-amount"
            label={
              isYearlyRecurring
                ? `Previous year amount (${activeAmountYear})`
                : "Previous year amount"
            }
            value={form.previousYearAmount}
            onChange={(value) => setField("previousYearAmount", value)}
            placeholder="0"
            required
            disabled={submitting}
          />
          <FormField
            id="bp-referred-by"
            label="Referred by"
            value={form.referredBy}
            onChange={(e) => setField("referredBy", e.target.value)}
            placeholder="Name or reference (optional)"
            disabled={submitting}
          />
          <IndianAmountField
            id="bp-curr-amount"
            label={
              isYearlyRecurring
                ? `Current year amount (${activeAmountYear})`
                : "Current year amount"
            }
            value={form.currentYearAmount}
            onChange={(value) => setField("currentYearAmount", value)}
            placeholder="0"
            required
            disabled={submitting}
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
            <dd className="font-medium text-zinc-900">
              {form.startDate === form.endDate
                ? form.startDate
                : `${form.startDate} - ${form.endDate}`}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Belongs to</dt>
            <dd className="font-medium text-zinc-900">{belongsLabel}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Schedule</dt>
            <dd className="font-medium text-zinc-900">
              {recurrenceLabel}
              {form.recurrenceType === RECURRENCE_TYPES.YEARLY && form.recurrenceEndDate
                ? ` (until ${form.recurrenceEndDate})`
                : ""}
            </dd>
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

          {isYearlyRecurring ? (
            <div className="space-y-3 border-t border-zinc-200 pt-3">
              <p className="text-zinc-500">Amounts by year</p>
              {reviewYearlyAmounts.map((y) => (
                <div
                  key={y.year}
                  className="flex flex-wrap justify-between gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-2"
                >
                  <span className="font-medium text-zinc-900">{y.year}</span>
                  <span className="tabular-nums text-zinc-700">
                    Final: ₹ {formatMoney(y.finalAmount ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div>
                <dt className="text-zinc-500">Previous year amount</dt>
                <dd className="font-medium text-zinc-900">
                  ₹ {formatMoney(parseAmountInput(form.previousYearAmount))}
                </dd>
              </div>
              {form.referredBy?.trim() ? (
                <div>
                  <dt className="text-zinc-500">Referred by</dt>
                  <dd className="font-medium text-zinc-900">{form.referredBy.trim()}</dd>
                </div>
              ) : null}
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
            </>
          )}
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
