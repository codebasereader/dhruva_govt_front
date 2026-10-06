import apiClient from "./client";
import { unwrapEntity } from "./utils";

const BASE = "client-finances";

export async function getClientFinanceBySource({ sourceType, sourceId }) {
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

export async function bulkGetClientFinances({ sourceType, sourceIds }) {
  if (!sourceIds?.length) return {};

  const { data } = await apiClient.post(`${BASE}/bulk-lookup`, {
    sourceType,
    sourceIds,
  });
  return unwrapEntity(data) ?? {};
}

export async function createClientFinance(payload) {
  const { data } = await apiClient.post(BASE, payload);
  return unwrapEntity(data);
}

export async function updateClientFinance(id, payload) {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return unwrapEntity(data);
}
