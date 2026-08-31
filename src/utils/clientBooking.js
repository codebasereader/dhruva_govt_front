import { getEntityId } from "./entity";

export function formatBookingDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(
    String(dateString).length <= 10 ? `${dateString}T12:00:00` : dateString,
  );
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatBookingAmount(amount) {
  if (!amount && amount !== 0) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function capitalizeFirstLetter(value) {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getEventName(eventName) {
  if (typeof eventName === "string") return eventName || "N/A";
  return eventName?.name || "N/A";
}

export function getPersonName(person) {
  if (!person) return "";
  if (typeof person === "string") return person;
  return (
    person.name ||
    [person.first_name ?? person.firstName, person.last_name ?? person.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    person.email ||
    ""
  );
}

export function getBookedByDisplay(record) {
  const source = record?.bookedBy || record?.createdBy;
  if (!source) return "-";
  if (typeof source === "string") return capitalizeFirstLetter(source) || "-";
  const first =
    source.first_name ?? source.firstName ?? String(source.name || "").split(" ")[0];
  if (!first) return "-";
  return capitalizeFirstLetter(String(first).split(/\s+/)[0]) || "-";
}

export function isCompletePaymentWedding(record) {
  return getEventName(record?.eventName) === "Wedding" && record?.advancePaymentType === "complete";
}

export function getTotalPayable(record) {
  if (isCompletePaymentWedding(record)) {
    return record.eventTypes?.[0]?.totalPayable || 0;
  }
  return (
    record.eventTypes?.reduce((sum, et) => sum + (et.totalPayable || 0), 0) || 0
  );
}

function getCompleteWeddingAdvanceFieldTotal(record, field) {
  const byKey = new Map();
  (record?.eventTypes || []).forEach((et) => {
    (et?.advances || []).forEach((adv, idx) => {
      const key =
        adv?.advanceNumber != null && adv.advanceNumber !== ""
          ? `n:${adv.advanceNumber}`
          : `i:${idx}`;
      const amt = Number(adv?.[field]);
      const value = Number.isFinite(amt) ? amt : 0;
      const prev = byKey.get(key) ?? 0;
      if (value > prev) byKey.set(key, value);
    });
  });
  let total = 0;
  for (const value of byKey.values()) total += value;
  return total;
}

export function getTotalExpectedAdvances(record) {
  if (isCompletePaymentWedding(record)) {
    return getCompleteWeddingAdvanceFieldTotal(record, "expectedAmount");
  }
  let total = 0;
  record.eventTypes?.forEach((et) => {
    et.advances?.forEach((adv) => {
      total += adv.expectedAmount || 0;
    });
  });
  return total;
}

export function getTotalReceivedAdvances(record) {
  if (isCompletePaymentWedding(record)) {
    return getCompleteWeddingAdvanceFieldTotal(record, "receivedAmount");
  }
  let total = 0;
  record.eventTypes?.forEach((et) => {
    et.advances?.forEach((adv) => {
      total += adv.receivedAmount || 0;
    });
  });
  return total;
}

/** Do not trust advanceTotals.totalReceivedAmount for complete weddings (double-count). */
export function getBookingReceivedAmount(record) {
  if (isCompletePaymentWedding(record)) {
    return getTotalReceivedAdvances(record);
  }
  if (record?.advanceTotals?.totalReceivedAmount != null) {
    return Number(record.advanceTotals.totalReceivedAmount) || 0;
  }
  return getTotalReceivedAdvances(record);
}

export function getPaymentCollectedPercent(booked, received) {
  if (!booked || booked <= 0) return 0;
  return Math.min(Math.round((received / booked) * 100), 100);
}

export function getEventsListTotalsBucket(totalsByStatus, listTabKey) {
  if (!totalsByStatus || typeof totalsByStatus !== "object") return null;
  if (listTabKey === "all") return totalsByStatus.all ?? null;
  if (listTabKey === "inprogress") {
    return totalsByStatus.inprogress ?? totalsByStatus.pending ?? null;
  }
  return totalsByStatus[listTabKey] ?? null;
}

export function getTabLabelBookingCount(totalsByStatus, listTabKey) {
  const b = getEventsListTotalsBucket(totalsByStatus, listTabKey);
  const n = b?.totalBookingsNumber;
  return typeof n === "number" && !Number.isNaN(n) ? n : null;
}

export function getVenueName(venue) {
  if (!venue) return "—";
  if (typeof venue === "string") return venue;
  return venue.name ?? venue.venueName ?? "—";
}

export function getCeremonyName(et) {
  if (!et) return "Ceremony";
  if (typeof et.eventType === "string") return et.eventType;
  return et.eventType?.name || "Ceremony";
}

export function parseVenues(raw) {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.venues)
      ? raw.venues
      : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.data)
          ? raw.data
          : [];
  return (Array.isArray(list) ? list : [])
    .map((v) => ({
      label: v?.name ?? v?.venueName ?? "Unnamed venue",
      value: String(v?.id ?? v?._id ?? ""),
    }))
    .filter((o) => o.value)
    .sort((a, b) => String(a.label).localeCompare(String(b.label)));
}

export function normalizeBooking(event) {
  if (!event || typeof event !== "object") return null;
  return {
    ...event,
    id: getEntityId(event),
  };
}
