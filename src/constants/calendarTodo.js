export const CALENDAR_TODO_VIEW_MODES = {
  MONTH: "month",
  WEEK: "week",
  DAY: "day",
};

export const CALENDAR_TODO_VIEW_OPTIONS = [
  { value: CALENDAR_TODO_VIEW_MODES.MONTH, label: "Month" },
  { value: CALENDAR_TODO_VIEW_MODES.WEEK, label: "Week" },
  { value: CALENDAR_TODO_VIEW_MODES.DAY, label: "Day" },
];

/** Backend colour enum — see docs/calendar-todos-api-schema.md */
export const TODO_COLOR_OPTIONS = [
  { value: "blue", label: "Blue", bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", solid: "bg-blue-500" },
  { value: "green", label: "Green", bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200", solid: "bg-emerald-500" },
  { value: "red", label: "Red", bg: "bg-red-100", text: "text-red-800", border: "border-red-200", solid: "bg-red-500" },
  { value: "amber", label: "Amber", bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", solid: "bg-amber-500" },
  { value: "purple", label: "Purple", bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-200", solid: "bg-violet-500" },
  { value: "teal", label: "Teal", bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200", solid: "bg-teal-500" },
  { value: "pink", label: "Pink", bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200", solid: "bg-pink-500" },
];

export const DEFAULT_TODO_COLOR = "blue";

export const TODO_COLOR_MAP = Object.fromEntries(
  TODO_COLOR_OPTIONS.map((opt) => [opt.value, opt]),
);

/** Hour labels for week/day timed grid (0–23). */
export const DAY_HOURS = Array.from({ length: 24 }, (_, h) => h);
