import apiClient from "./client";
import { unwrapEntity, unwrapList } from "./utils";

const BASE = "departments";

export async function getDepartments() {
  const { data } = await apiClient.get(BASE);
  return unwrapList(data);
}

export async function getDepartmentById(id) {
  const { data } = await apiClient.get(`${BASE}/${id}`);
  return unwrapEntity(data);
}

export async function createDepartment(payload) {
  const { data } = await apiClient.post(BASE, payload);
  return unwrapEntity(data);
}

export async function updateDepartment(id, payload) {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return unwrapEntity(data);
}

export async function deleteDepartment(id) {
  const { data } = await apiClient.delete(`${BASE}/${id}`);
  return unwrapEntity(data);
}
