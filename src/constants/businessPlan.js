export const PLAN_TAB_TYPES = {
  ALL: "all",
  DISTRICT: "district",
  DEPARTMENT: "department",
};

export const BELONGS_TO = {
  DISTRICT: "district",
  DEPARTMENT: "department",
};

export const EVENT_TYPES = {
  MCA: "MCA",
  TENDER: "TENDER",
  FORGI_DC: "FORGI_DC",
};

export const EVENT_TYPE_OPTIONS = [
  { value: EVENT_TYPES.MCA, label: "MCA" },
  { value: EVENT_TYPES.TENDER, label: "Tender" },
  {
    value: EVENT_TYPES.FORGI_DC,
    label: "Department Forgi / DC Forgi",
  },
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
  [EVENT_TYPES.FORGI_DC]: {
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
