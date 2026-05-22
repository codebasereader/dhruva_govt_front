import apiClient from "./client";
import { unwrapEntity, unwrapList } from "./utils";

const BASE = "venues";

/** Global venue list (not scoped by district or department). */
export async function getVenues() {
  const { data } = await apiClient.get(BASE);
  return unwrapList(data);
}

export async function getVenueById(id) {
  const { data } = await apiClient.get(`${BASE}/${id}`);
  return unwrapEntity(data);
}

export async function createVenue(payload) {
  const { data } = await apiClient.post(BASE, payload);
  return unwrapEntity(data);
}

export async function updateVenue(id, payload) {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return unwrapEntity(data);
}

export async function deleteVenue(id) {
  const { data } = await apiClient.delete(`${BASE}/${id}`);
  return unwrapEntity(data);
}
