import wedLeadsClient from "./wedLeadsClient";
import {
  normalizeClientLead,
  parseClientLeadSummary,
  parseClientLeadsList,
  parseCoordinators,
  getPersonDisplayName,
} from "../utils/clientLead";
import { getEntityId } from "../utils/entity";

/**
 * @param {{
 *   status?: string,
 *   assignedTo?: string,
 *   startDate?: string,
 *   endDate?: string,
 *   month?: string,
 * }} [params]
 */
export async function getClientLeads(params = {}) {
  const query = {};
  if (params.status) query.status = params.status;
  if (params.assignedTo) query.assignedTo = params.assignedTo;
  if (params.startDate && params.endDate) {
    query.startDate = params.startDate;
    query.endDate = params.endDate;
    if (params.month) query.month = params.month;
  }

  const { data } = await wedLeadsClient.get("client-leads", { params: query });
  const leads = parseClientLeadsList(data).map(normalizeClientLead).filter(Boolean);
  const summary = parseClientLeadSummary(data);

  return { leads, summary, raw: data };
}

/**
 * @param {string} id
 */
export async function getClientLeadById(id) {
  const { data } = await wedLeadsClient.get(`client-leads/${id}`);
  const payload = data?.data ?? data;
  return normalizeClientLead(payload);
}

export async function getCoordinators() {
  const { data } = await wedLeadsClient.get("coordinators");
  return parseCoordinators(data).map((c) => ({
    value: getEntityId(c),
    label: getPersonDisplayName(c) || getEntityId(c),
    raw: c,
  }));
}
