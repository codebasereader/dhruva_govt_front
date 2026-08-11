import {
  BELONGS_TO,
  EVENT_TYPE_OPTIONS,
  GST_RATES,
  LEGACY_EVENT_TYPE_FORGI_DC,
  RECURRENCE_TYPES,
} from "../constants/businessPlan";
import {
  buildYearlyAmountEntry,
  calculateBusinessPlanAmounts,
  formatMoney,
  parseAmountInput,
} from "./businessPlanAmounts";
import { getEntityId } from "./entity";
import { formatMonthKey, toDateString } from "./calendar";

export function getAnchorYearFromDate(dateStr) {
  if (!dateStr) return null;
  const y = Number(String(dateStr).slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

export function emptyYearAmountFields() {
  return {
    previousYearAmount: "",
    referredBy: "",
    currentYearAmount: "",
    gstRate: null,
  };
}

export function yearAmountFieldsFromSlice(slice) {
  if (!slice) return emptyYearAmountFields();
  return {
    previousYearAmount:
      slice.previousYearAmount != null && slice.previousYearAmount !== ""
        ? String(Math.round(Number(slice.previousYearAmount)))
        : "",
    referredBy: slice.referredBy ?? "",
    currentYearAmount:
      slice.currentYearAmount != null && slice.currentYearAmount !== ""
        ? String(Math.round(Number(slice.currentYearAmount)))
        : "",
    gstRate:
      slice.gstRate === 18
        ? GST_RATES.EIGHTEEN
        : slice.gstRate === 5
          ? GST_RATES.FIVE
          : null,
  };
}

function normalizeYearlyAmountSlice(raw) {
  const year = Number(raw.year);
  if (!Number.isFinite(year)) return null;

  const eventType = raw.eventType;
  const gstRate = raw.gstRate ?? raw.gst_rate;
  const currentYearAmount = raw.currentYearAmount ?? raw.current_year_amount;

  const computed =
    currentYearAmount != null && currentYearAmount !== "" && eventType && gstRate != null
      ? calculateBusinessPlanAmounts({
          eventType,
          currentYearAmount,
          gstRate,
        })
      : null;

  return {
    year,
    previousYearAmount: normalizeNumber(raw.previousYearAmount ?? raw.previous_year_amount),
    referredBy: raw.referredBy ?? raw.referred_by ?? "",
    currentYearAmount: normalizeNumber(currentYearAmount),
    gstRate: gstRate ?? null,
    mcaSurchargePercent:
      raw.mcaSurchargePercent ??
      raw.mca_surcharge_percent ??
      computed?.mcaSurchargePercent ??
      null,
    mcaSurchargeAmount: normalizeNumber(
      raw.mcaSurchargeAmount ?? raw.mca_surcharge_amount ?? computed?.mcaSurchargeAmount,
    ),
    amountBeforeGst: normalizeNumber(
      raw.amountBeforeGst ?? raw.amount_before_gst ?? computed?.amountBeforeGst,
    ),
    gstBaseAmount: normalizeNumber(
      raw.gstBaseAmount ?? raw.gst_base_amount ?? computed?.gstBaseAmount,
    ),
    gstAmount: normalizeNumber(raw.gstAmount ?? raw.gst_amount ?? computed?.gstAmount),
    grandTotal: normalizeNumber(raw.grandTotal ?? raw.grand_total ?? computed?.grandTotal),
    finalAmount: normalizeNumber(
      raw.finalAmount ?? raw.final_amount ?? raw.grandTotal ?? raw.grand_total ?? computed?.finalAmount,
    ),
  };
}

function synthesizeYearlyAmountsFromRoot(raw, startDate, eventType) {
  const anchorYear = getAnchorYearFromDate(startDate);
  if (!anchorYear) return [];

  const slice = normalizeYearlyAmountSlice({
    year: anchorYear,
    eventType,
    previousYearAmount: raw.previousYearAmount ?? raw.previous_year_amount,
    referredBy: raw.referredBy ?? raw.referred_by,
    currentYearAmount: raw.currentYearAmount ?? raw.current_year_amount,
    gstRate: raw.gstRate ?? raw.gst_rate,
    mcaSurchargePercent: raw.mcaSurchargePercent ?? raw.mca_surcharge_percent,
    mcaSurchargeAmount: raw.mcaSurchargeAmount ?? raw.mca_surcharge_amount,
    amountBeforeGst: raw.amountBeforeGst ?? raw.amount_before_gst,
    gstBaseAmount: raw.gstBaseAmount ?? raw.gst_base_amount,
    gstAmount: raw.gstAmount ?? raw.gst_amount,
    finalAmount: raw.finalAmount ?? raw.final_amount ?? raw.grandTotal ?? raw.grand_total,
  });

  return slice ? [slice] : [];
}

function normalizeYearlyAmountsList(raw, startDate, eventType) {
  const list = Array.isArray(raw.yearlyAmounts)
    ? raw.yearlyAmounts
    : Array.isArray(raw.yearly_amounts)
      ? raw.yearly_amounts
      : [];

  const normalized = list
    .map((item) => normalizeYearlyAmountSlice({ ...item, eventType }))
    .filter(Boolean)
    .sort((a, b) => a.year - b.year);

  if (normalized.length) return normalized;

  const recurrenceType = normalizeRecurrenceType(raw);
  if (recurrenceType === RECURRENCE_TYPES.YEARLY) {
    return synthesizeYearlyAmountsFromRoot(raw, startDate, eventType);
  }

  return [];
}

function applyAmountSliceToEvent(event, slice) {
  if (!slice) return event;
  return {
    ...event,
    previousYearAmount: slice.previousYearAmount,
    referredBy: slice.referredBy ?? "",
    currentYearAmount: slice.currentYearAmount,
    gstRate: slice.gstRate,
    mcaSurchargePercent: slice.mcaSurchargePercent,
    mcaSurchargeAmount: slice.mcaSurchargeAmount,
    amountBeforeGst: slice.amountBeforeGst,
    gstBaseAmount: slice.gstBaseAmount,
    gstAmount: slice.gstAmount,
    grandTotal: slice.grandTotal,
    finalAmount: slice.finalAmount,
  };
}

/** Merge active wizard fields into yearlyAmounts for a given year. */
export function mergeActiveYearIntoYearlyAmounts(form, activeYear) {
  if (!Number.isFinite(activeYear)) return form.yearlyAmounts ?? [];

  const built = buildYearlyAmountEntry(activeYear, {
    eventType: form.eventType,
    previousYearAmount: form.previousYearAmount,
    referredBy: form.referredBy,
    currentYearAmount: form.currentYearAmount,
    gstRate: form.gstRate,
  });

  const list = [...(form.yearlyAmounts ?? [])];
  const idx = list.findIndex((y) => y.year === activeYear);
  const formEntry = {
    year: activeYear,
    previousYearAmount: built.previousYearAmount,
    referredBy: built.referredBy ?? "",
    currentYearAmount: built.currentYearAmount,
    gstRate: built.gstRate,
    mcaSurchargePercent: built.mcaSurchargePercent,
    mcaSurchargeAmount: built.mcaSurchargeAmount,
    amountBeforeGst: built.amountBeforeGst,
    gstBaseAmount: built.gstBaseAmount,
    gstAmount: built.gstAmount,
    grandTotal: built.grandTotal,
    finalAmount: built.finalAmount,
  };

  if (idx >= 0) list[idx] = formEntry;
  else list.push(formEntry);

  return list.sort((a, b) => a.year - b.year);
}

export function resolveEventForCalendarYear(event, calendarYear) {
  const normalized = normalizeBusinessPlanEvent(event);

  if (normalized.recurrenceType !== RECURRENCE_TYPES.YEARLY) {
    return {
      ...normalized,
      amountsConfigured: true,
      amountCalendarYear: calendarYear,
    };
  }

  const slice = normalized.yearlyAmounts.find((y) => y.year === calendarYear);
  if (!slice) {
    return {
      ...normalized,
      amountsConfigured: false,
      amountCalendarYear: calendarYear,
    };
  }

  return {
    ...applyAmountSliceToEvent(normalized, slice),
    amountsConfigured: true,
    amountCalendarYear: calendarYear,
  };
}

export function normalizeBusinessPlanEvent(raw) {
  const recurrenceType = normalizeRecurrenceType(raw);
  const startDate = normalizeDate(
    raw.startDate ?? raw.start_date ?? raw.date ?? raw.eventDate,
  );
  const endDate = normalizeDate(
    raw.endDate ?? raw.end_date ?? raw.date ?? raw.eventDate ?? startDate,
  );
  const eventType = normalizeEventType(raw);
  const yearlyAmounts = normalizeYearlyAmountsList(raw, startDate, eventType);

  const base = {
    id: getEntityId(raw),
    eventName: raw.eventName ?? raw.name ?? "",
    date: startDate,
    startDate,
    endDate,
    belongsTo: raw.belongsTo ?? raw.belongs_to ?? "",
    districtId: raw.districtId ?? raw.district_id ?? "",
    departmentId: raw.departmentId ?? raw.department_id ?? "",
    venueId: raw.venueId ?? raw.venue_id ?? "",
    eventType,
    referredBy: raw.referredBy ?? raw.referred_by ?? "",
    previousYearAmount: normalizeNumber(raw.previousYearAmount ?? raw.previous_year_amount),
    currentYearAmount: normalizeNumber(raw.currentYearAmount ?? raw.current_year_amount),
    gstRate: raw.gstRate ?? raw.gst_rate ?? null,
    mcaSurchargePercent: raw.mcaSurchargePercent ?? raw.mca_surcharge_percent ?? null,
    mcaSurchargeAmount: normalizeNumber(raw.mcaSurchargeAmount ?? raw.mca_surcharge_amount),
    amountBeforeGst: normalizeNumber(raw.amountBeforeGst ?? raw.amount_before_gst),
    gstBaseAmount: normalizeNumber(raw.gstBaseAmount ?? raw.gst_base_amount),
    gstAmount: normalizeNumber(raw.gstAmount ?? raw.gst_amount),
    grandTotal: normalizeNumber(raw.grandTotal ?? raw.grand_total),
    finalAmount: normalizeNumber(
      raw.finalAmount ?? raw.final_amount ?? raw.grandTotal ?? raw.grand_total,
    ),
    recurrenceType,
    recurrenceEndDate: normalizeDate(raw.recurrenceEndDate ?? raw.recurrence_end_date),
    isRecurring: recurrenceType === RECURRENCE_TYPES.YEARLY || Boolean(raw.isRecurring ?? raw.is_recurring),
    yearlyAmounts,
    districtName: raw.districtName ?? raw.district?.name ?? "",
    departmentName: raw.departmentName ?? raw.department?.name ?? "",
    venueName: raw.venueName ?? raw.venue?.name ?? "",
    venueAddress: raw.venueAddress ?? raw.venue_address ?? raw.venue?.address ?? "",
  };

  if (recurrenceType === RECURRENCE_TYPES.YEARLY && yearlyAmounts.length) {
    const anchorYear = getAnchorYearFromDate(startDate);
    const anchorSlice =
      yearlyAmounts.find((y) => y.year === anchorYear) ?? yearlyAmounts[0];
    return applyAmountSliceToEvent(base, anchorSlice);
  }

  return base;
}

function normalizeNumber(value) {
  if (value === "" || value == null) return null;
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? n : null;
}

function normalizeEventType(raw) {
  const t = raw.eventType ?? raw.event_type ?? raw.type ?? "";
  if (t === LEGACY_EVENT_TYPE_FORGI_DC) return LEGACY_EVENT_TYPE_FORGI_DC;
  return t;
}

function normalizeRecurrenceType(raw) {
  const value = String(
    raw.recurrenceType ??
      raw.recurrence_type ??
      (raw.isRecurring ?? raw.is_recurring ? RECURRENCE_TYPES.YEARLY : RECURRENCE_TYPES.ONE_TIME),
  ).toUpperCase();
  return value === RECURRENCE_TYPES.YEARLY ? RECURRENCE_TYPES.YEARLY : RECURRENCE_TYPES.ONE_TIME;
}

export function formatBelongsToLabel(belongsTo) {
  if (belongsTo === BELONGS_TO.BOTH) return "District & Department";
  if (belongsTo === BELONGS_TO.DISTRICT) return "District";
  if (belongsTo === BELONGS_TO.DEPARTMENT) return "Department";
  return belongsTo ? String(belongsTo) : "—";
}

export function formatEventDateLabel(dateStr) {
  const start = dateStr;
  const end = arguments.length > 1 ? arguments[1] : undefined;

  if (!start) return "—";

  const formatSingle = (d) =>
    new Date(`${d}T12:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (!end || end === start) return formatSingle(start);
  return `${formatSingle(start)} - ${formatSingle(end)}`;
}

export function formatVenueLabel(event) {
  const name = event.venueName?.trim();
  const address = event.venueAddress?.trim();
  if (name && address) return `${name} — ${address}`;
  return name || address || "—";
}

export function formatEventTypeLabel(eventType) {
  const found = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType);
  if (found) return found.label;
  if (eventType === LEGACY_EVENT_TYPE_FORGI_DC) return "Department Forgi / DC Forgi";
  return eventType ?? "—";
}

export function formatAmountCell(value, options = {}) {
  if (options.amountsConfigured === false) return "Amounts not set";
  if (value == null || value === "") return "—";
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return "—";
  return `₹ ${formatMoney(n)}`;
}

/** Dedupe events by id from a date-keyed map (monthly calendar). */
export function getUniqueEventsFromByDate(eventsByDate) {
  const seen = new Set();
  const list = [];
  for (const dayEvents of Object.values(eventsByDate ?? {})) {
    for (const ev of dayEvents) {
      const key = ev.id ?? `${ev.eventName}-${ev.startDate}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(ev);
    }
  }
  return list;
}

/** Dedupe events by id across all months (yearly calendar). */
export function getUniqueEventsFromByMonth(eventsByMonth) {
  const seen = new Set();
  const list = [];
  for (const monthEvents of Object.values(eventsByMonth ?? {})) {
    for (const ev of monthEvents) {
      const key = ev.id ?? `${ev.eventName}-${ev.startDate}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(ev);
    }
  }
  return list;
}

function emptyTypeStatBucket(eventType, label) {
  return {
    eventType,
    label,
    count: 0,
    totalFinalAmount: 0,
    unsetAmountCount: 0,
  };
}

/**
 * Per event-type counts and sum of final amounts for a period (month or year).
 * Always returns one row per EVENT_TYPE_OPTIONS entry (includes zeros).
 */
export function aggregateEventTypeStats(events) {
  const buckets = Object.fromEntries(
    EVENT_TYPE_OPTIONS.map((opt) => [opt.value, emptyTypeStatBucket(opt.value, opt.label)]),
  );

  const seen = new Set();
  for (const ev of events ?? []) {
    const dedupeKey = ev.id ?? `${ev.eventName}-${ev.startDate}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const type = ev.eventType || "";
    if (!buckets[type]) {
      buckets[type] = emptyTypeStatBucket(type, formatEventTypeLabel(type));
    }

    buckets[type].count += 1;
    if (ev.amountsConfigured === false) {
      buckets[type].unsetAmountCount += 1;
    } else {
      const amt = ev.finalAmount ?? ev.grandTotal;
      if (amt != null && Number.isFinite(Number(amt))) {
        buckets[type].totalFinalAmount += Math.round(Number(amt));
      }
    }
  }

  return EVENT_TYPE_OPTIONS.map((opt) => buckets[opt.value] ?? emptyTypeStatBucket(opt.value, opt.label));
}

export function formatTypeStatAmount(row) {
  if (!row || row.count === 0) return "₹ 0";
  if (row.unsetAmountCount === row.count) return "Amounts not set";
  const base = `₹ ${formatMoney(row.totalFinalAmount)}`;
  if (row.unsetAmountCount > 0) {
    return `${base} (${row.unsetAmountCount} unset)`;
  }
  return base;
}

/** Short location line for calendar pills and compact UI. */
export function formatEventLocationSummary(event) {
  const district = event.districtName?.trim();
  const department = event.departmentName?.trim();

  if (event.belongsTo === BELONGS_TO.BOTH) {
    if (district && department) return `${district} · ${department}`;
    return district || department || "—";
  }
  if (event.belongsTo === BELONGS_TO.DEPARTMENT) {
    return department || "—";
  }
  return district || "—";
}

function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

/**
 * Calendar occurrences with inclusive start/end date keys.
 * Used for day grouping and multi-day spanning bars.
 */
export function listEventOccurrences(events, options = {}) {
  const targetYear = options.year;
  const targetMonthIndex = options.monthIndex;
  const results = [];

  for (const event of events) {
    const normalizedEvent = normalizeBusinessPlanEvent(event);
    const start = normalizedEvent.startDate ?? normalizedEvent.date;
    const end = normalizedEvent.endDate ?? normalizedEvent.date ?? start;
    if (!start) continue;

    const baseStartDate = new Date(`${start}T12:00:00`);
    const baseEndDate = new Date(`${end}T12:00:00`);
    if (Number.isNaN(baseStartDate.getTime()) || Number.isNaN(baseEndDate.getTime())) {
      continue;
    }

    const occurrences =
      normalizedEvent.recurrenceType === RECURRENCE_TYPES.YEARLY &&
      Number.isInteger(targetYear) &&
      Number.isInteger(targetMonthIndex)
        ? buildYearlyOccurrenceForMonth(normalizedEvent, targetYear, targetMonthIndex)
        : [{ startDate: baseStartDate, endDate: baseEndDate }];

    for (const occurrence of occurrences) {
      const startKey = toDateString(occurrence.startDate);
      const endKey = toDateString(occurrence.endDate);
      const calendarYear = occurrence.startDate.getFullYear();
      const displayEvent = resolveEventForCalendarYear(normalizedEvent, calendarYear);
      results.push({
        event: displayEvent,
        startDate: startKey,
        endDate: endKey,
        occurrenceKey: `${displayEvent.id ?? displayEvent.eventName}|${startKey}|${endKey}`,
      });
    }
  }

  return results;
}

export function groupEventsByDate(events, options = {}) {
  const occurrences = listEventOccurrences(events, options);

  return occurrences.reduce((acc, occurrence) => {
    const start = new Date(`${occurrence.startDate}T12:00:00`);
    const end = new Date(`${occurrence.endDate}T12:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return acc;

    const days = Math.max(
      0,
      Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
    );
    for (let i = 0; i <= days; i += 1) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const key = toDateString(d);
      if (!acc[key]) acc[key] = [];
      acc[key].push(occurrence.event);
    }
    return acc;
  }, {});
}

function buildYearlyOccurrenceForMonth(event, targetYear, targetMonthIndex) {
  const sourceStart = event.startDate ?? event.date;
  const sourceEnd = event.endDate ?? event.startDate ?? event.date;
  if (!sourceStart || !sourceEnd) return [];

  const sourceStartDate = new Date(`${sourceStart}T12:00:00`);
  const sourceEndDate = new Date(`${sourceEnd}T12:00:00`);
  if (Number.isNaN(sourceStartDate.getTime()) || Number.isNaN(sourceEndDate.getTime())) return [];

  const sourceYear = sourceStartDate.getFullYear();
  if (targetYear < sourceYear) return [];

  const recurrenceEnd = event.recurrenceEndDate
    ? new Date(`${event.recurrenceEndDate}T12:00:00`)
    : null;
  if (recurrenceEnd && targetYear > recurrenceEnd.getFullYear()) return [];

  const spanDays = Math.max(
    0,
    Math.floor((sourceEndDate.getTime() - sourceStartDate.getTime()) / (24 * 60 * 60 * 1000)),
  );
  const startMonth = sourceStartDate.getMonth();
  if (startMonth !== targetMonthIndex) return [];

  const startDay = Math.min(sourceStartDate.getDate(), daysInMonth(targetYear, startMonth));
  const nextStart = new Date(targetYear, startMonth, startDay, 12, 0, 0);
  const nextEnd = new Date(nextStart.getTime() + spanDays * 24 * 60 * 60 * 1000);

  if (recurrenceEnd && nextStart.getTime() > recurrenceEnd.getTime()) return [];
  return [{ startDate: nextStart, endDate: nextEnd }];
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Yearly calendar: { "YYYY-MM": Event[] } (deduped per month). */
export function groupEventsByMonth(events, { year }) {
  if (!Number.isInteger(year)) return {};

  const result = {};
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const byDate = groupEventsByDate(events, { year, monthIndex });
    const monthKey = formatMonthKey(year, monthIndex);
    const seen = new Set();
    const monthEvents = [];

    for (const dayEvents of Object.values(byDate)) {
      for (const ev of dayEvents) {
        const id = ev.id;
        if (id && seen.has(id)) continue;
        if (id) seen.add(id);
        monthEvents.push(ev);
      }
    }

    if (monthEvents.length) result[monthKey] = monthEvents;
  }

  return result;
}

function applyRootAmountsFromSlice(payload, slice) {
  if (!slice) return;
  payload.previousYearAmount = slice.previousYearAmount;
  payload.referredBy = slice.referredBy;
  payload.currentYearAmount = slice.currentYearAmount;
  payload.gstRate = slice.gstRate;
  payload.mcaSurchargePercent = slice.mcaSurchargePercent;
  payload.mcaSurchargeAmount = slice.mcaSurchargeAmount;
  payload.amountBeforeGst = slice.amountBeforeGst;
  payload.gstBaseAmount = slice.gstBaseAmount;
  payload.gstAmount = slice.gstAmount;
  payload.grandTotal = slice.grandTotal;
  payload.finalAmount = slice.finalAmount;
}

export function buildEventPayload(form) {
  const startDate = form.startDate ?? form.date;
  const endDate = form.endDate ?? form.startDate ?? form.date;

  const payload = {
    eventName: form.eventName.trim(),
    startDate,
    endDate,
    date: startDate,
    belongsTo: form.belongsTo,
    eventType: form.eventType,
    recurrenceType: form.recurrenceType,
    isRecurring: form.recurrenceType === RECURRENCE_TYPES.YEARLY,
    recurrenceEndDate:
      form.recurrenceType === RECURRENCE_TYPES.YEARLY && form.recurrenceEndDate
        ? form.recurrenceEndDate
        : null,
    venueId: form.venueId || null,
  };

  if (form.belongsTo === BELONGS_TO.DISTRICT) {
    payload.districtId = form.districtId;
    payload.departmentId = null;
  } else if (form.belongsTo === BELONGS_TO.DEPARTMENT) {
    payload.departmentId = form.departmentId;
    payload.districtId = null;
  } else {
    payload.districtId = form.districtId;
    payload.departmentId = form.departmentId;
  }

  if (form.recurrenceType === RECURRENCE_TYPES.YEARLY) {
    const anchorYear = getAnchorYearFromDate(startDate);
    let yearlyAmounts = Array.isArray(form.yearlyAmounts) ? [...form.yearlyAmounts] : [];

    if (form.activeAmountYear != null && Number.isFinite(form.activeAmountYear)) {
      yearlyAmounts = mergeActiveYearIntoYearlyAmounts(
        { ...form, yearlyAmounts },
        form.activeAmountYear,
      );
    } else if (!yearlyAmounts.length && anchorYear) {
      yearlyAmounts = [
        buildYearlyAmountEntry(anchorYear, {
          eventType: form.eventType,
          previousYearAmount: form.previousYearAmount,
          referredBy: form.referredBy,
          currentYearAmount: form.currentYearAmount,
          gstRate: form.gstRate,
        }),
      ];
    } else {
      yearlyAmounts = yearlyAmounts.map((entry) =>
        buildYearlyAmountEntry(entry.year, {
          eventType: form.eventType,
          previousYearAmount:
            entry.previousYearAmount != null ? String(entry.previousYearAmount) : "",
          referredBy: entry.referredBy,
          currentYearAmount:
            entry.currentYearAmount != null ? String(entry.currentYearAmount) : "",
          gstRate: entry.gstRate,
        }),
      );
    }

    payload.yearlyAmounts = yearlyAmounts;
    const anchorSlice =
      yearlyAmounts.find((y) => y.year === anchorYear) ?? yearlyAmounts[0];
    applyRootAmountsFromSlice(payload, anchorSlice);
    return payload;
  }

  const amounts = calculateBusinessPlanAmounts({
    eventType: form.eventType,
    currentYearAmount: form.currentYearAmount,
    gstRate: form.gstRate,
  });
  payload.previousYearAmount =
    form.previousYearAmount === "" || form.previousYearAmount == null
      ? null
      : parseAmountInput(form.previousYearAmount);
  payload.referredBy = form.referredBy?.trim() || null;
  payload.currentYearAmount = amounts.currentYearAmount;
  payload.gstRate = form.gstRate;
  payload.mcaSurchargePercent = amounts.mcaSurchargePercent;
  payload.mcaSurchargeAmount = amounts.mcaSurchargeAmount;
  payload.amountBeforeGst = amounts.amountBeforeGst;
  payload.gstBaseAmount = amounts.gstBaseAmount;
  payload.gstAmount = amounts.gstAmount;
  payload.grandTotal = amounts.grandTotal;
  payload.finalAmount = amounts.finalAmount;

  return payload;
}
