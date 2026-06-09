import apiClient from "./client";
import { unwrapEntity, unwrapList } from "./utils";

const BASE = "business-plans";

/**
 * @param {{
 *   type?: string,
 *   month?: string,
 *   year?: number | string,
 *   districtId?: string,
 *   departmentId?: string,
 * }} params
 * type: all | district | department
 * month: YYYY-MM (monthly calendar view)
 * year: YYYY (yearly calendar view; do not send month with year)
 */
export async function getBusinessPlanEvents(params = {}) {
  const query = {};
  if (params.type) query.type = params.type;
  if (params.month) query.month = params.month;
  if (params.year != null && params.year !== "") query.year = String(params.year);
  if (params.districtId) query.districtId = params.districtId;
  if (params.departmentId) query.departmentId = params.departmentId;

  const { data } = await apiClient.get(BASE, { params: query });
  return unwrapList(data);
}

const EMPTY_LIST_STATS = {
  totalEvents: 0,
  totalAmount: 0,
  totalCurrentYearAmount: 0,
  totalPreviousYearAmount: 0,
};

/**
 * @param {{
 *   search?: string,
 *   startDate?: string,
 *   endDate?: string,
 *   districtId?: string,
 *   departmentId?: string,
 *   type?: string,
 * }} params
 */
export async function getBusinessPlanList(params = {}) {
  const query = {};
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;
  if (params.districtId) query.districtId = params.districtId;
  if (params.departmentId) query.departmentId = params.departmentId;
  if (params.type) query.type = params.type;

  const { data } = await apiClient.get(`${BASE}/list`, { params: query });
  const payload = unwrapEntity(data);

  return {
    events: Array.isArray(payload?.events) ? payload.events : [],
    stats: payload?.stats ?? EMPTY_LIST_STATS,
  };
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
