export const FINANCE_SOURCE_TYPES = {
  LEAD: "lead",
  BOOKING: "booking",
};

export const FINANCE_SOURCE_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: FINANCE_SOURCE_TYPES.LEAD, label: "Lead" },
  { value: FINANCE_SOURCE_TYPES.BOOKING, label: "Booking" },
];

export const FINANCE_SOURCE_TYPE_LABELS = {
  [FINANCE_SOURCE_TYPES.LEAD]: "Lead",
  [FINANCE_SOURCE_TYPES.BOOKING]: "Booking",
};

export const FINANCE_SOURCE_TYPE_STYLES = {
  [FINANCE_SOURCE_TYPES.LEAD]: "border-sky-200 bg-sky-50 text-sky-800",
  [FINANCE_SOURCE_TYPES.BOOKING]: "border-violet-200 bg-violet-50 text-violet-800",
};

export const BUDGET_REPORTS_PAGE_SIZE_OPTIONS = [10, 20, 50];
export const BUDGET_REPORTS_DEFAULT_PAGE_SIZE = 20;

export const ADVANCE_STATUSES = {
  PENDING: "Pending",
  RECEIVED: "Received",
};

export const ADVANCE_STATUS_OPTIONS = [
  { value: ADVANCE_STATUSES.PENDING, label: "Pending" },
  { value: ADVANCE_STATUSES.RECEIVED, label: "Received" },
];

export const ADVANCE_STATUS_STYLES = {
  [ADVANCE_STATUSES.PENDING]: "border-amber-200 bg-amber-50 text-amber-900",
  [ADVANCE_STATUSES.RECEIVED]: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export const ACCOUNT_GST_PERCENT = 18;
