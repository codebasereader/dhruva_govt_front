import apiClient from "./client";
import { unwrapEntity, unwrapList } from "./utils";
import { DEFAULT_TODO_COLOR } from "../constants/calendarTodo";
import { getEntityId } from "../utils/entity";

const BASE = "todos";

/**
 * Normalize API todo (`id` or `_id`; `notes` not description).
 * @param {object} raw
 */
export function normalizeCalendarTodo(raw) {
  if (!raw || typeof raw !== "object") return null;

  const allDay = Boolean(raw.allDay);
  return {
    id: getEntityId(raw),
    title: String(raw.title ?? "").trim(),
    date: String(raw.date ?? "").slice(0, 10),
    allDay,
    startTime: allDay ? null : String(raw.startTime ?? "").slice(0, 5) || null,
    endTime: allDay ? null : String(raw.endTime ?? "").slice(0, 5) || null,
    notes: raw.notes == null ? "" : String(raw.notes),
    color: raw.color || DEFAULT_TODO_COLOR,
    completed: Boolean(raw.completed),
    userId: raw.userId ?? raw.user_id ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
  };
}

/**
 * Body for create/update — matches backend schema.
 * @param {object} form
 */
export function buildTodoPayload(form) {
  const allDay = Boolean(form.allDay);
  return {
    title: String(form.title ?? "").trim(),
    date: form.date,
    allDay,
    startTime: allDay ? null : form.startTime || null,
    endTime: allDay ? null : form.endTime || null,
    notes: String(form.notes ?? "").trim() || null,
    color: form.color || DEFAULT_TODO_COLOR,
    completed: Boolean(form.completed),
  };
}

/**
 * @param {{
 *   month?: string,
 *   date?: string,
 *   completed?: boolean,
 * }} params
 * month: YYYY-MM — calendar month view
 * date: YYYY-MM-DD — single day (send either month or date)
 */
export async function getCalendarTodos(params = {}) {
  const query = {};
  if (params.month) query.month = params.month;
  if (params.date) query.date = params.date;
  if (params.completed === true || params.completed === false) {
    query.completed = params.completed;
  }

  const { data } = await apiClient.get(BASE, { params: query });
  return unwrapList(data)
    .map(normalizeCalendarTodo)
    .filter(Boolean);
}

/**
 * @param {string} id
 */
export async function getCalendarTodoById(id) {
  const { data } = await apiClient.get(`${BASE}/${id}`);
  return normalizeCalendarTodo(unwrapEntity(data));
}

/**
 * @param {object} payload
 */
export async function createCalendarTodo(payload) {
  const { data } = await apiClient.post(BASE, buildTodoPayload(payload));
  return normalizeCalendarTodo(unwrapEntity(data));
}

/**
 * @param {string} id
 * @param {object} payload
 */
export async function updateCalendarTodo(id, payload) {
  const { data } = await apiClient.put(`${BASE}/${id}`, buildTodoPayload(payload));
  return normalizeCalendarTodo(unwrapEntity(data));
}

/**
 * @param {string} id
 */
export async function deleteCalendarTodo(id) {
  const { data } = await apiClient.delete(`${BASE}/${id}`);
  return unwrapEntity(data);
}
