import wedLeadsClient from "./wedLeadsClient";
import {
  CLIENT_BOOKINGS_LIST_TAB_API_STATUS,
} from "../constants/clientBookings";
import {
  normalizeBooking,
  parseVenues,
} from "../utils/clientBooking";

/**
 * @param {{
 *   page?: number,
 *   limit?: number,
 *   listStatusTab?: string,
 *   eventName?: string,
 *   venueId?: string,
 *   startDate?: string,
 *   endDate?: string,
 * }} params
 */
export async function getClientBookings(params = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const query = { page, limit };

  const statusParam =
    CLIENT_BOOKINGS_LIST_TAB_API_STATUS[params.listStatusTab ?? "all"];
  if (statusParam) query.status = statusParam;
  if (params.eventName) query.eventName = params.eventName;
  if (params.venueId) {
    query.venueId = params.venueId;
    query.venueLocation = params.venueId;
  }
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;

  const { data } = await wedLeadsClient.get("events", { params: query });
  const payload = data || {};
  const events = (Array.isArray(payload.events) ? payload.events : [])
    .map(normalizeBooking)
    .filter(Boolean);

  return {
    events,
    bookingsSummary: payload,
    totalsByStatus: payload.totalsByStatus ?? null,
    page: payload.page ?? page,
    limit: payload.limit ?? limit,
    total: payload.totalEvents ?? payload.total ?? events.length,
    totalPages: payload.totalPages ?? null,
  };
}

/**
 * @param {string} id
 */
export async function getClientBookingById(id) {
  const { data } = await wedLeadsClient.get(`events/${id}`);
  const payload = data?.event ?? data?.data ?? data;
  return normalizeBooking(payload);
}

export async function getClientBookingVenues() {
  const { data } = await wedLeadsClient.get("venue");
  return parseVenues(data);
}
