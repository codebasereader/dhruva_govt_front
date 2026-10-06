import apiClient from "./client";
import { unwrapEntity } from "./utils";

const BASE = "budget-reports";

export async function getBudgetReportBySource({ sourceType, sourceId }) {
  try {
    const { data } = await apiClient.get(`${BASE}/by-source`, {
      params: { sourceType, sourceId },
    });
    return unwrapEntity(data);
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

export async function bulkGetBudgetReports({ sourceType, sourceIds }) {
  if (!sourceIds?.length) return {};

  const { data } = await apiClient.post(`${BASE}/bulk-lookup`, {
    sourceType,
    sourceIds,
  });
  return unwrapEntity(data) ?? {};
}

/** `sourceType` is optional — omit it to search budget reports across every source type. */
export async function searchBudgetReports({
  sourceType,
  search,
  updatedFrom,
  updatedTo,
  page = 1,
  limit = 20,
} = {}) {
  const { data } = await apiClient.get(BASE, {
    params: { sourceType, search, updatedFrom, updatedTo, page, limit },
  });
  return unwrapEntity(data) ?? { items: [], total: 0 };
}

export async function createBudgetReport(payload) {
  const { data } = await apiClient.post(BASE, payload);
  return unwrapEntity(data);
}

export async function cloneBudgetReport({
  fromBudgetReportId,
  sourceType,
  sourceId,
  sourceLabel,
}) {
  const { data } = await apiClient.post(`${BASE}/clone`, {
    fromBudgetReportId,
    sourceType,
    sourceId,
    sourceLabel,
  });
  return unwrapEntity(data);
}

export async function updateBudgetReport(id, payload) {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return unwrapEntity(data);
}
