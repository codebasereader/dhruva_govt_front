export const CLIENT_BOOKINGS_LIST_TAB_API_STATUS = {
  all: undefined,
  confirmed: "confirmed",
  inprogress: "inprogress",
  cancelled: "cancelled",
};

export const CLIENT_BOOKINGS_STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "inprogress", label: "In progress" },
  { key: "cancelled", label: "Cancelled" },
];

export const EVENT_CONFIRMATION_STYLES = {
  "Confirmed Event": "border-emerald-200 bg-emerald-50 text-emerald-800",
  InProgress: "border-amber-200 bg-amber-50 text-amber-900",
  Pending: "border-sky-200 bg-sky-50 text-sky-800",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
};

export const BOOKINGS_PAGE_SIZE_OPTIONS = [10, 20, 50];
export const BOOKINGS_DEFAULT_PAGE_SIZE = 20;
