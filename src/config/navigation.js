import { ROLES } from "../../config.js";

export const DISTRICT_DEPARTMENT_NAV_ITEMS = [
  { label: "Districts", path: "/admin/districts" },
  { label: "Departments", path: "/admin/departments" },
  { label: "Venues", path: "/admin/venues" },
  { label: "Database", path: "/admin/database" },
];

export const OWNER_ONLY_NAV_ITEMS = [
  { label: "Calendar", path: "/owner/calendar" },
  { label: "Wed-Leads", path: "/owner/wed-leads" },
  { label: "My leads", path: "/owner/my-leads" },
  { label: "Business Plan", path: "/owner/business-plan" },
  { label: "Bookings", path: "/owner/bookings" },
  { label: "Vendors", path: "/owner/vendors" },
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

  const firstRouted = OWNER_NAV_ITEMS.find((item) => item.path);
  return firstRouted?.path ?? "/owner/calendar";
}

/** Owner nav items that have a real route (excludes coming-soon placeholders). */
export function getRoutedOwnerOnlyNavItems() {
  return OWNER_ONLY_NAV_ITEMS.filter((item) => Boolean(item.path));
}
