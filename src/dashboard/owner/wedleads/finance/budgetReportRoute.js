import { FINANCE_SOURCE_TYPES } from "../../../../constants/finance";

export const WED_LEADS_TAB_BY_SOURCE_TYPE = {
  [FINANCE_SOURCE_TYPES.LEAD]: "leads-tracker",
  [FINANCE_SOURCE_TYPES.BOOKING]: "bookings",
};

export function buildBudgetReportPath({ sourceType, sourceId, sourceLabel }) {
  const params = new URLSearchParams();
  if (sourceLabel) params.set("label", sourceLabel);
  const query = params.toString();
  return `/owner/wed-leads/budget-report/${sourceType}/${encodeURIComponent(sourceId)}${
    query ? `?${query}` : ""
  }`;
}
