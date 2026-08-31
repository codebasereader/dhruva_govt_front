import axios from "axios";
import { WED_LEADS_API_BASE_URL } from "../../config.js";

/**
 * Isolated client for Wed-Leads (`client-leads`, `events`, `venue`, coordinators).
 * Uses WED_LEADS_API_BASE_URL — never the main API_BASE_URL.
 */
const wedLeadsClient = axios.create({
  baseURL: WED_LEADS_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Auth header per Leads Tracker contract:
 * `Authorization: <access_token>` (token as returned from login).
 */
export function setWedLeadsAuthToken(token) {
  if (token) {
    // Contract: Authorization: <access_token> (no Bearer prefix unless already present)
    wedLeadsClient.defaults.headers.common.Authorization = String(token);
  } else {
    delete wedLeadsClient.defaults.headers.common.Authorization;
  }
}

export default wedLeadsClient;
