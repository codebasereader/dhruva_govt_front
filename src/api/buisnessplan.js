import apiClient from "./client";
import { unwrapEntity, unwrapList } from "./utils";

const BASE = "business-plans";

/**
 * @param {{ type?: string, month?: string, districtId?: string, departmentId?: string }} params
 * type: all | district | department
 * month: YYYY-MM
 */
export async function getBusinessPlanEvents(params = {}) {
  const query = {};
  if (params.type) query.type = params.type;
  if (params.month) query.month = params.month;
  if (params.districtId) query.districtId = params.districtId;
  if (params.departmentId) query.departmentId = params.departmentId;

  const { data } = await apiClient.get(BASE, { params: query });
  return unwrapList(data);
}

export async function getBusinessPlanEventById(id) {
  const { data } = await apiClient.get(`${BASE}/${id}`);
  return unwrapEntity(data);
}

export async function createBusinessPlanEvent(payload) {
  const { data } = await apiClient.post(BASE, payload);
  return unwrapEntity(data);
}

export async function updateBusinessPlanEvent(id, payload) {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return unwrapEntity(data);
}

export async function deleteBusinessPlanEvent(id) {
  const { data } = await apiClient.delete(`${BASE}/${id}`);
  return unwrapEntity(data);
}
