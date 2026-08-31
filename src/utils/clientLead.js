import { getEntityId } from "./entity";

export function getPersonDisplayName(person) {
  if (!person) return "";
  if (typeof person === "string") return person;
  const full = [person.first_name ?? person.firstName, person.last_name ?? person.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    person.name ||
    full ||
    person.email ||
    String(person._id ?? person.id ?? "")
  );
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(
    String(dateStr).length <= 10 ? `${dateStr}T12:00:00` : dateStr,
  );
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatAmountINR(value) {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

export function getNotesDisplay(notes, max = 100) {
  if (!notes) return "—";
  const text = String(notes);
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function toYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMonthBounds(year, monthIndex) {
  const startDate = toYmd(new Date(year, monthIndex, 1));
  const endDate = toYmd(new Date(year, monthIndex + 1, 0));
  const month = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  return { startDate, endDate, month };
}

export function parseClientLeadsList(resData) {
  const list = resData?.data ?? resData?.leads ?? resData;
  return Array.isArray(list) ? list : [];
}

export function parseCoordinators(resData) {
  const raw = resData;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.coordinators)
      ? raw.coordinators
      : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.data)
          ? raw.data
          : [];
  return Array.isArray(list) ? list : [];
}

export function parseClientLeadSummary(resData) {
  const summary = resData?.summary;
  if (!summary || typeof summary !== "object") return null;
  if (
    summary.totalEstimatedBudget == null &&
    summary.totalConvertedBudget == null
  ) {
    return null;
  }
  return {
    totalEstimatedBudget: Number(summary.totalEstimatedBudget) || 0,
    totalConvertedBudget: Number(summary.totalConvertedBudget) || 0,
    estimatedLeadsCount: Number(summary.estimatedLeadsCount) || 0,
    convertedLeadsCount: Number(summary.convertedLeadsCount) || 0,
  };
}

/** Client fallback when API summary is missing. */
export function computeBudgetSummaryFromLeads(leads, rangeStart, rangeEnd) {
  let totalEstimatedBudget = 0;
  let totalConvertedBudget = 0;
  let estimatedLeadsCount = 0;
  let convertedLeadsCount = 0;
  const hasRange = Boolean(rangeStart && rangeEnd);

  for (const lead of leads || []) {
    const budget = Number(lead?.estimatedBudget) || 0;
    const startRaw = lead?.startDate;
    if (hasRange) {
      if (!startRaw) continue;
      const start = new Date(
        String(startRaw).length <= 10 ? `${startRaw}T12:00:00` : startRaw,
      );
      if (Number.isNaN(start.getTime())) continue;
      const ymd = toYmd(start);
      if (ymd < rangeStart || ymd > rangeEnd) continue;
    }
    if (lead?.convertedByMarketing) {
      totalConvertedBudget += budget;
      convertedLeadsCount += 1;
    } else {
      totalEstimatedBudget += budget;
      estimatedLeadsCount += 1;
    }
  }

  return {
    totalEstimatedBudget,
    totalConvertedBudget,
    estimatedLeadsCount,
    convertedLeadsCount,
  };
}

export function normalizeClientLead(lead) {
  if (!lead || typeof lead !== "object") return null;
  return {
    ...lead,
    id: getEntityId(lead),
  };
}
