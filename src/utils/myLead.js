import { getEntityId } from "./entity";
import { MY_LEAD_MEETING_STATUSES } from "../constants/myLeads";

/**
 * @param {object} meeting
 * @param {number} index
 */
export function normalizeMeeting(meeting, index = 0) {
  if (!meeting || typeof meeting !== "object") {
    return {
      id: `temp_${index}`,
      meetingDate: "",
      meetingNotes: "",
    };
  }

  return {
    id: getEntityId(meeting) || meeting.tempId || `temp_${index}`,
    meetingDate: String(meeting.meetingDate ?? meeting.date ?? "").slice(0, 10),
    meetingNotes: String(meeting.meetingNotes ?? meeting.notes ?? ""),
  };
}

/**
 * @param {object} lead
 */
export function normalizeMyLead(lead) {
  if (!lead || typeof lead !== "object") return null;

  const meetings = Array.isArray(lead.meetings) ? lead.meetings : [];

  return {
    id: getEntityId(lead),
    clientName: String(lead.clientName ?? lead.name ?? "").trim(),
    phoneNumber: String(lead.phoneNumber ?? lead.phone ?? "").trim(),
    alternativeNumber: String(
      lead.alternativeNumber ?? lead.alternateNumber ?? "",
    ).trim(),
    meetingStatus:
      lead.meetingStatus ??
      lead.status ??
      MY_LEAD_MEETING_STATUSES.PENDING,
    meetings: meetings.map(normalizeMeeting),
    userId: lead.userId ?? lead.user_id ?? null,
    createdAt: lead.createdAt ?? lead.created_at ?? null,
    updatedAt: lead.updatedAt ?? lead.updated_at ?? null,
  };
}

/**
 * Build create/update body for API.
 * @param {object} form
 */
export function buildMyLeadPayload(form) {
  const meetings = (form.meetings ?? [])
    .filter((m) => m.meetingDate)
    .map((m) => ({
      meetingDate: m.meetingDate,
      meetingNotes: String(m.meetingNotes ?? "").trim() || null,
    }));

  return {
    clientName: String(form.clientName ?? "").trim(),
    phoneNumber: String(form.phoneNumber ?? "").trim(),
    alternativeNumber: String(form.alternativeNumber ?? "").trim() || null,
    meetingStatus: form.meetingStatus || MY_LEAD_MEETING_STATUSES.PENDING,
    meetings,
  };
}

export function emptyMeetingRow() {
  return {
    id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    meetingDate: "",
    meetingNotes: "",
  };
}

export function emptyMyLeadForm() {
  return {
    clientName: "",
    phoneNumber: "",
    alternativeNumber: "",
    meetingStatus: MY_LEAD_MEETING_STATUSES.PENDING,
    meetings: [emptyMeetingRow()],
  };
}

export function leadToForm(lead) {
  if (!lead) return emptyMyLeadForm();
  const n = normalizeMyLead(lead);
  return {
    clientName: n.clientName,
    phoneNumber: n.phoneNumber,
    alternativeNumber: n.alternativeNumber,
    meetingStatus: n.meetingStatus,
    meetings:
      n.meetings.length > 0
        ? n.meetings.map((m) => ({ ...m }))
        : [emptyMeetingRow()],
  };
}

export function formatMeetingDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
