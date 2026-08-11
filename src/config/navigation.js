import { ROLES } from "../../config.js";

export const DISTRICT_DEPARTMENT_NAV_ITEMS = [
  { label: "Districts", path: "/admin/districts" },
  { label: "Departments", path: "/admin/departments" },
  { label: "Venues", path: "/admin/venues" },
  { label: "Database", path: "/admin/database" },
];

export const OWNER_ONLY_NAV_ITEMS = [
  { label: "Actual Plan", path: "/owner/actual-plan" },
  { label: "Business Plan", path: "/owner/business-plan" },
  { label: "Bookings", path: "/owner/bookings" },
  { label: "Vendors", path: "/owner/vendors" },
  { label: "Leads Tracker", path: "/owner/leads-tracker" },
];

/** Owner menu: core pages + shared districts & departments */
export const OWNER_NAV_ITEMS = [
  ...OWNER_ONLY_NAV_ITEMS,
  ...DISTRICT_DEPARTMENT_NAV_ITEMS,
];

export const ADMIN_NAV_ITEMS = [
  { label: "Users", path: "/admin/users" },
  ...DISTRICT_DEPARTMENT_NAV_ITEMS,
];

/** @deprecated Use getNavItemsForRole instead */
export const NAV_ITEMS = OWNER_NAV_ITEMS;

function normalizeRole(role) {
  return String(role ?? "").toLowerCase();
}

export function getNavItemsForRole(role) {
  if (normalizeRole(role) === ROLES.Admin) {
    return ADMIN_NAV_ITEMS;
  }

  return OWNER_NAV_ITEMS;
}

export function getDefaultPathForRole(role) {
  if (normalizeRole(role) === ROLES.Admin) {
    return ADMIN_NAV_ITEMS[0].path;
  }

  return OWNER_NAV_ITEMS[0].path;
}
