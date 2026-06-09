import apiClient from "./client";
import { unwrapEntity, unwrapList } from "./utils";

const ENTRIES_BASE = "database";
const CATEGORIES_BASE = "database/categories";

// —— Entries ——

export async function getDatabaseEntries(params = {}) {
  const query = {};
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.categoryId) query.categoryId = params.categoryId;

  const { data } = await apiClient.get(ENTRIES_BASE, { params: query });
  return unwrapList(data);
}

export async function getDatabaseEntryById(id) {
  const { data } = await apiClient.get(`${ENTRIES_BASE}/${id}`);
  return unwrapEntity(data);
}

export async function createDatabaseEntry(payload) {
  const { data } = await apiClient.post(ENTRIES_BASE, payload);
  return unwrapEntity(data);
}

export async function updateDatabaseEntry(id, payload) {
  const { data } = await apiClient.put(`${ENTRIES_BASE}/${id}`, payload);
  return unwrapEntity(data);
}

export async function deleteDatabaseEntry(id) {
  const { data } = await apiClient.delete(`${ENTRIES_BASE}/${id}`);
  return unwrapEntity(data);
}

// —— Categories ——

export async function getDatabaseCategories(params = {}) {
  const query = {};
  if (params.search?.trim()) query.search = params.search.trim();

  const { data } = await apiClient.get(CATEGORIES_BASE, { params: query });
  return unwrapList(data);
}

export async function createDatabaseCategory(payload) {
  const { data } = await apiClient.post(CATEGORIES_BASE, payload);
  return unwrapEntity(data);
}

export async function updateDatabaseCategory(id, payload) {
  const { data } = await apiClient.put(`${CATEGORIES_BASE}/${id}`, payload);
  return unwrapEntity(data);
}

export async function deleteDatabaseCategory(id) {
  const { data } = await apiClient.delete(`${CATEGORIES_BASE}/${id}`);
  return unwrapEntity(data);
}
