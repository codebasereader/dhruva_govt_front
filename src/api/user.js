import apiClient from "./client";
import { unwrapEntity, unwrapList } from "./utils";

const BASE = "admin/users";

export async function getUsers() {
  const { data } = await apiClient.get(BASE);
  return unwrapList(data);
}

export async function getUserById(id) {
  const { data } = await apiClient.get(`${BASE}/${id}`);
  return unwrapEntity(data);
}

export async function createUser(payload) {
  const { data } = await apiClient.post(BASE, payload);
  return unwrapEntity(data);
}

export async function updateUser(id, payload) {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return unwrapEntity(data);
}

export async function deleteUser(id) {
  const { data } = await apiClient.delete(`${BASE}/${id}`);
  return unwrapEntity(data);
}
