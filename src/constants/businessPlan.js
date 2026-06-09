export const PLAN_TAB_TYPES = {
  ALL: "all",
  DISTRICT: "district",
  DEPARTMENT: "department",
};

export const CALENDAR_VIEW_MODES = {
  MONTH: "month",
  YEAR: "year",
};

export const CALENDAR_VIEW_OPTIONS = [
  { value: CALENDAR_VIEW_MODES.MONTH, label: "Monthly" },
  { value: CALENDAR_VIEW_MODES.YEAR, label: "Yearly" },
];

export const BELONGS_TO = {
  DISTRICT: "district",
  DEPARTMENT: "department",
  BOTH: "both",
};

export const GST_RATES = {
  FIVE: 5,
  EIGHTEEN: 18,
};

export const RECURRENCE_TYPES = {
  ONE_TIME: "ONE_TIME",
  YEARLY: "YEARLY",
};

export const RECURRENCE_OPTIONS = [
  { value: RECURRENCE_TYPES.ONE_TIME, label: "One-time event" },
  { value: RECURRENCE_TYPES.YEARLY, label: "Recurring yearly event" },
];

export const MCA_SURCHARGE_PERCENT = 5;

export const EVENT_TYPES = {
  MCA: "MCA",
  TENDER: "TENDER",
  DEPARTMENT_4G: "DEPARTMENT_4G",
  DC_4G: "DC_4G",
};

/** @deprecated API may still return FORGI_DC */
export const LEGACY_EVENT_TYPE_FORGI_DC = "FORGI_DC";

export const EVENT_TYPE_OPTIONS = [
  { value: EVENT_TYPES.MCA, label: "MCA" },
  { value: EVENT_TYPES.TENDER, label: "Tender" },
  { value: EVENT_TYPES.DEPARTMENT_4G, label: "Department 4(g)" },
  { value: EVENT_TYPES.DC_4G, label: "DC (4g)" },
];

export const EVENT_TYPE_STYLES = {
  [EVENT_TYPES.MCA]: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  [EVENT_TYPES.TENDER]: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  [EVENT_TYPES.DEPARTMENT_4G]: {
    bg: "bg-yellow-100",
    text: "text-yellow-900",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
  },
  [EVENT_TYPES.DC_4G]: {
    bg: "bg-amber-100",
    text: "text-amber-900",
    border: "border-amber-200",
    dot: "bg-amber-600",
  },
  [LEGACY_EVENT_TYPE_FORGI_DC]: {
    bg: "bg-yellow-100",
    text: "text-yellow-900",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
  },
};

export const PLAN_TABS = [
  { id: PLAN_TAB_TYPES.ALL, label: "All" },
  { id: PLAN_TAB_TYPES.DISTRICT, label: "District" },
  { id: PLAN_TAB_TYPES.DEPARTMENT, label: "Department" },
];
