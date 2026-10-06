import apiClient from "./client";
import { unwrapEntity, unwrapList } from "./utils";

const BASE = "todos";

/**
 * @param {{ month?: string, date?: string, completed?: boolean }} params
 * month: YYYY-MM (calendar month view)
 * date: YYYY-MM-DD (single day)
 */
export async function getTodos(params = {}) {
  const query = {};
  if (params.month) query.month = params.month;
  if (params.date) query.date = params.date;
  if (params.completed === true || params.completed === false) {
    query.completed = params.completed;
  }

  const { data } = await apiClient.get(BASE, { params: query });
  return unwrapList(data);
}

export async function getTodoById(id) {
  const { data } = await apiClient.get(`${BASE}/${id}`);
  return unwrapEntity(data);
}

export async function createTodo(payload) {
  const { data } = await apiClient.post(BASE, payload);
  return unwrapEntity(data);
}

export async function updateTodo(id, payload) {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return unwrapEntity(data);
}

export async function deleteTodo(id) {
  const { data } = await apiClient.delete(`${BASE}/${id}`);
  return unwrapEntity(data);
}
