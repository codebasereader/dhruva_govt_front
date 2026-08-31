export const CLIENT_LEAD_STATUSES = {
  INPROGRESS: "Inprogress",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

export const CLIENT_LEAD_STATUS_OPTIONS = [
  { value: CLIENT_LEAD_STATUSES.INPROGRESS, label: "Inprogress" },
  { value: CLIENT_LEAD_STATUSES.CONFIRMED, label: "Confirmed" },
  { value: CLIENT_LEAD_STATUSES.CANCELLED, label: "Cancelled" },
];

export const CLIENT_LEAD_STATUS_STYLES = {
  [CLIENT_LEAD_STATUSES.INPROGRESS]:
    "border-amber-200 bg-amber-50 text-amber-900",
  [CLIENT_LEAD_STATUSES.CONFIRMED]:
    "border-emerald-200 bg-emerald-50 text-emerald-800",
  [CLIENT_LEAD_STATUSES.CANCELLED]: "border-red-200 bg-red-50 text-red-700",
};

export const WED_LEADS_TABS = {
  TRACKER: "leads-tracker",
  BOOKINGS: "bookings",
};

export const WED_LEADS_TAB_OPTIONS = [
  { value: WED_LEADS_TABS.TRACKER, label: "Leads Tracker" },
  { value: WED_LEADS_TABS.BOOKINGS, label: "Bookings" },
];

export const LEADS_TRACKER_PAGE_SIZE_OPTIONS = [10, 20, 50];
export const LEADS_TRACKER_DEFAULT_PAGE_SIZE = 10;
