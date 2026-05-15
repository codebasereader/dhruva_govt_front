import { getEntityId } from "./entity";

export function normalizeBusinessPlanEvent(raw) {
  return {
    id: getEntityId(raw),
    eventName: raw.eventName ?? raw.name ?? "",
    date: normalizeDate(raw.date ?? raw.eventDate),
    belongsTo: raw.belongsTo ?? raw.belongs_to ?? "",
    districtId: raw.districtId ?? raw.district_id ?? "",
    departmentId: raw.departmentId ?? raw.department_id ?? "",
    eventType: raw.eventType ?? raw.event_type ?? raw.type ?? "",
    districtName: raw.districtName ?? raw.district?.name ?? "",
    departmentName: raw.departmentName ?? raw.department?.name ?? "",
  };
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
  };

  if (form.belongsTo === "district") {
    payload.districtId = form.districtId;
    payload.departmentId = null;
  } else {
    payload.departmentId = form.departmentId;
    payload.districtId = null;
  }

  return payload;
}
