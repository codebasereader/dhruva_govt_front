import apiClient from "./client";
import { unwrapEntity, unwrapList } from "./utils";
import { normalizeMyLead } from "../utils/myLead";

const BASE = "my-leads";

/**
 * @param {{
 *   search?: string,
 *   meetingStatus?: string,
 * }} [params]
 */
export async function getMyLeads(params = {}) {
  const query = {};
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.meetingStatus) query.meetingStatus = params.meetingStatus;

  const { data } = await apiClient.get(BASE, { params: query });
  return unwrapList(data).map(normalizeMyLead).filter(Boolean);
}

/**
 * @param {string} id
 */
export async function getMyLeadById(id) {
  const { data } = await apiClient.get(`${BASE}/${id}`);
  return normalizeMyLead(unwrapEntity(data));
}

/**
 * @param {object} payload
 */
export async function createMyLead(payload) {
  const { data } = await apiClient.post(BASE, payload);
  return normalizeMyLead(unwrapEntity(data));
}

/**
 * @param {string} id
 * @param {object} payload
 */
export async function updateMyLead(id, payload) {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return normalizeMyLead(unwrapEntity(data));
}

/**
 * @param {string} id
 */
export async function deleteMyLead(id) {
  const { data } = await apiClient.delete(`${BASE}/${id}`);
  return unwrapEntity(data);
}
