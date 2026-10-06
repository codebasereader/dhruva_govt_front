export const MY_LEAD_MEETING_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
};

export const MY_LEAD_MEETING_STATUS_OPTIONS = [
  { value: MY_LEAD_MEETING_STATUSES.PENDING, label: "Pending" },
  { value: MY_LEAD_MEETING_STATUSES.CONFIRMED, label: "Confirmed" },
  { value: MY_LEAD_MEETING_STATUSES.REJECTED, label: "Rejected" },
];

export const MY_LEAD_MEETING_STATUS_STYLES = {
  [MY_LEAD_MEETING_STATUSES.PENDING]:
    "bg-amber-50 text-amber-800 border-amber-200",
  [MY_LEAD_MEETING_STATUSES.CONFIRMED]:
    "bg-emerald-50 text-emerald-800 border-emerald-200",
  [MY_LEAD_MEETING_STATUSES.REJECTED]:
    "bg-red-50 text-red-700 border-red-200",
};

export function getMyLeadStatusLabel(status) {
  return (
    MY_LEAD_MEETING_STATUS_OPTIONS.find((o) => o.value === status)?.label ??
    status ??
    "—"
  );
}
