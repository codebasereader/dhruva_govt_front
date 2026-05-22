import { BELONGS_TO, EVENT_TYPE_OPTIONS } from "../constants/businessPlan";
import {
  calculateBusinessPlanAmounts,
  formatMoney,
  parseAmountInput,
} from "./businessPlanAmounts";
import { getEntityId } from "./entity";

export function normalizeBusinessPlanEvent(raw) {
  return {
    id: getEntityId(raw),
    eventName: raw.eventName ?? raw.name ?? "",
    date: normalizeDate(raw.date ?? raw.eventDate),
    belongsTo: raw.belongsTo ?? raw.belongs_to ?? "",
    districtId: raw.districtId ?? raw.district_id ?? "",
    departmentId: raw.departmentId ?? raw.department_id ?? "",
    venueId: raw.venueId ?? raw.venue_id ?? "",
    eventType: raw.eventType ?? raw.event_type ?? raw.type ?? "",
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
    districtName: raw.districtName ?? raw.district?.name ?? "",
    departmentName: raw.departmentName ?? raw.department?.name ?? "",
    venueName: raw.venueName ?? raw.venue?.name ?? "",
    venueAddress: raw.venueAddress ?? raw.venue_address ?? raw.venue?.address ?? "",
  };
}

function normalizeNumber(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatBelongsToLabel(belongsTo) {
  if (belongsTo === BELONGS_TO.BOTH) return "District & Department";
  if (belongsTo === BELONGS_TO.DISTRICT) return "District";
  if (belongsTo === BELONGS_TO.DEPARTMENT) return "Department";
  return belongsTo ? String(belongsTo) : "—";
}

export function formatEventDateLabel(dateStr) {
  if (!dateStr) return "—";
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatVenueLabel(event) {
  const name = event.venueName?.trim();
  const address = event.venueAddress?.trim();
  if (name && address) return `${name} — ${address}`;
  return name || address || "—";
}

export function formatEventTypeLabel(eventType) {
  return EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.label ?? eventType ?? "—";
}

export function formatAmountCell(value) {
  if (value == null || value === "") return "—";
  return `₹ ${formatMoney(value)}`;
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

export function groupEventsByDate(events) {
  return events.reduce((acc, event) => {
    const key = event.date;
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});
}

export function buildEventPayload(form) {
  const payload = {
    eventName: form.eventName.trim(),
    date: form.date,
    belongsTo: form.belongsTo,
    eventType: form.eventType,
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

  const amounts = calculateBusinessPlanAmounts({
    eventType: form.eventType,
    currentYearAmount: form.currentYearAmount,
    gstRate: form.gstRate,
  });
  payload.previousYearAmount = parseAmountInput(form.previousYearAmount) || null;
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
