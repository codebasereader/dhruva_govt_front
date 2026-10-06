import axios from "axios";
import { API_BASE_URL } from "../../config.js";
import { setWedLeadsAuthToken } from "./wedLeadsClient";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
  // Keep Wed-Leads client in sync (separate base URL; same login token).
  setWedLeadsAuthToken(token);
}

export default apiClient;
