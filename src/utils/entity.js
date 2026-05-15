export function getEntityId(entity) {
  return entity?.id ?? entity?._id ?? "";
}

export function formatRole(role) {
  if (!role) return "—";
  return String(role).charAt(0).toUpperCase() + String(role).slice(1).toLowerCase();
}
