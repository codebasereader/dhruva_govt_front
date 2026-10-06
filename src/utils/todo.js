import { TODO_COLOR_DEFAULT } from "../constants/todo";
import { getEntityId } from "./entity";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeTodo(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const allDay = Boolean(raw.allDay);
  const startTime = allDay ? "" : String(raw.startTime ?? "").slice(0, 5);
  const endTime = allDay ? "" : String(raw.endTime ?? "").slice(0, 5);

  return {
    id: getEntityId(raw),
    title: String(raw.title ?? "").trim(),
    date: String(raw.date ?? "").slice(0, 10),
    allDay,
    startTime,
    endTime,
    notes: String(raw.notes ?? ""),
    color: raw.color || TODO_COLOR_DEFAULT,
    completed: Boolean(raw.completed),
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export function buildTodoPayload(form) {
  const allDay = Boolean(form.allDay);
  return {
    title: String(form.title ?? "").trim(),
    date: form.date,
    allDay,
    startTime: allDay ? null : form.startTime || null,
    endTime: allDay ? null : form.endTime || null,
    notes: String(form.notes ?? "").trim() || null,
    color: form.color || TODO_COLOR_DEFAULT,
    completed: Boolean(form.completed),
  };
}

export function isValidDateString(value) {
  return DATE_RE.test(value);
}

export function isValidTimeString(value) {
  return TIME_RE.test(value);
}

export function compareTimes(a, b) {
  if (!a || !b) return 0;
  return a.localeCompare(b);
}

export function formatTimeLabel(hhmm) {
  if (!hhmm || !isValidTimeString(hhmm)) return "";
  const [hour, minute] = hhmm.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  if (minute === 0) return `${hour12} ${period}`;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function formatTodoTimeRange(todo) {
  if (!todo || todo.allDay) return "All day";
  const start = formatTimeLabel(todo.startTime);
  const end = formatTimeLabel(todo.endTime);
  if (start && end) return `${start} – ${end}`;
  return start || end || "";
}

export function getTimeOptions(stepMinutes = 15) {
  const options = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    const value = `${hour}:${minute}`;
    options.push({ value, label: formatTimeLabel(value) });
  }
  return options;
}

export function roundToNextHour(date = new Date()) {
  const next = new Date(date);
  next.setMinutes(0, 0, 0);
  if (date.getMinutes() > 0 || date.getSeconds() > 0) {
    next.setHours(next.getHours() + 1);
  }
  return next;
}

function toHm(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function getDefaultTimesForDate(dateString, now = new Date()) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (dateString === today) {
    const start = roundToNextHour(now);
    const hour = start.getHours();
    if (start.getDate() !== now.getDate() || hour >= 23) {
      return { startTime: "22:00", endTime: "23:00" };
    }
    const end = new Date(start);
    end.setHours(hour + 1);
    return { startTime: toHm(start), endTime: toHm(end) };
  }

  return { startTime: "09:00", endTime: "10:00" };
}

export function groupTodosByDate(todos) {
  const map = {};

  for (const todo of todos) {
    if (!todo?.date) continue;
    if (!map[todo.date]) map[todo.date] = [];
    map[todo.date].push(todo);
  }

  for (const date of Object.keys(map)) {
    map[date].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      const timeCmp = compareTimes(a.startTime, b.startTime);
      if (timeCmp !== 0) return timeCmp;
      return String(a.title).localeCompare(String(b.title));
    });
  }

  return map;
}

export function formatLongDate(dateString) {
  if (!dateString) return "";
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
