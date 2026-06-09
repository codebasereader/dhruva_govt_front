import { formatNamePrefix } from "../constants/database";
import { getEntityId } from "./entity";

export function normalizeDatabaseCategory(raw) {
  return {
    id: getEntityId(raw),
    name: raw.name?.trim() ?? "",
  };
}

export function normalizeDatabaseEntry(raw) {
  const category = raw.category ?? {};
  return {
    id: getEntityId(raw),
    categoryId: raw.categoryId ?? raw.category_id ?? getEntityId(category) ?? "",
    categoryName: raw.categoryName ?? raw.category_name ?? category.name ?? "",
    prefix: raw.prefix ?? "",
    name: raw.name?.trim() ?? "",
    contactNumber1: raw.contactNumber1 ?? raw.contact_number_1 ?? "",
    contactNumber2: raw.contactNumber2 ?? raw.contact_number_2 ?? "",
    email: raw.email?.trim() ?? "",
    address: raw.address?.trim() ?? "",
    companyName: (raw.companyName ?? raw.company_name ?? "").trim(),
    departmentName: (raw.departmentName ?? raw.department_name ?? "").trim(),
    designation: (raw.designation ?? "").trim(),
    referredBy: raw.referredBy ?? raw.referred_by ?? "",
  };
}

export function formatDatabaseFullName(entry) {
  const prefix = formatNamePrefix(entry.prefix);
  const name = entry.name?.trim() ?? "";
  if (prefix && name) return `${prefix} ${name}`;
  return name || prefix || "—";
}

export function buildDatabaseEntryPayload(form) {
  return {
    categoryId: form.categoryId,
    prefix: form.prefix,
    name: form.name.trim(),
    contactNumber1: form.contactNumber1.trim(),
    contactNumber2: form.contactNumber2.trim() || null,
    email: form.email.trim() || null,
    address: form.address.trim() || null,
    companyName: form.companyName.trim() || null,
    departmentName: form.departmentName.trim() || null,
    designation: form.designation.trim() || null,
    referredBy: form.referredBy.trim() || null,
  };
}
