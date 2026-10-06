import { toDateString } from "./calendar";

/** Start of week (Sunday) for a given date string or Date. */
export function getWeekStart(dateInput) {
  const d = typeof dateInput === "string" ? parseDateString(dateInput) : new Date(dateInput);
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

export function parseDateString(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Seven YYYY-MM-DD dates for the week containing `dateStr`. */
export function getWeekDates(dateStr) {
  const start = getWeekStart(dateStr);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return toDateString(d);
  });
}

export function shiftDays(dateStr, delta) {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + delta);
  return toDateString(d);
}

export function formatDayLabel(dateStr, opts = {}) {
  const d = parseDateString(dateStr);
  return d.toLocaleDateString("default", {
    weekday: opts.weekday ?? "short",
    month: opts.month ?? "short",
    day: "numeric",
    ...opts,
  });
}

export function formatLongDate(dateStr) {
  const d = parseDateString(dateStr);
  return d.toLocaleDateString("default", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** "9:00 AM" from "09:00" */
export function formatTimeLabel(hhmm) {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  let h = Number(hStr);
  const m = mStr ?? "00";
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${suffix}`;
}

export function formatHourLabel(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h} ${suffix}`;
}

/** Minutes from midnight for "HH:mm". */
export function timeToMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function compareTodosByTime(a, b) {
  if (Boolean(a.completed) !== Boolean(b.completed)) {
    return a.completed ? 1 : -1;
  }
  if (a.allDay && !b.allDay) return -1;
  if (!a.allDay && b.allDay) return 1;
  if (a.allDay && b.allDay) {
    return String(a.title).localeCompare(String(b.title));
  }
  const byTime = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  if (byTime !== 0) return byTime;
  return String(a.title).localeCompare(String(b.title));
}

export function groupTodosByDate(todos) {
  const map = {};
  for (const todo of todos) {
    const key = todo.date;
    if (!map[key]) map[key] = [];
    map[key].push(todo);
  }
  for (const key of Object.keys(map)) {
    map[key].sort(compareTodosByTime);
  }
  return map;
}

export function getDefaultStartTime() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes() < 30 ? 30 : 0;
  const hour = m === 0 ? h + 1 : h;
  return `${String(hour % 24).padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
}

export function addHourToTime(hhmm, hours = 1) {
  const mins = timeToMinutes(hhmm) + hours * 60;
  const clamped = Math.min(mins, 23 * 60 + 30);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
