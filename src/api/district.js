import apiClient from "./client";
import { unwrapEntity, unwrapList } from "./utils";

const BASE = "districts";

export async function getDistricts() {
  const { data } = await apiClient.get(BASE);
  return unwrapList(data);
}

export async function getDistrictById(id) {
  const { data } = await apiClient.get(`${BASE}/${id}`);
  return unwrapEntity(data);
}

export async function createDistrict(payload) {
  const { data } = await apiClient.post(BASE, payload);
  return unwrapEntity(data);
}

export async function updateDistrict(id, payload) {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return unwrapEntity(data);
}

export async function deleteDistrict(id) {
  const { data } = await apiClient.delete(`${BASE}/${id}`);
  return unwrapEntity(data);
}
