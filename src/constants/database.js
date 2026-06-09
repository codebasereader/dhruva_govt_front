export const NAME_PREFIXES = [
  { value: "MR", label: "Mr." },
  { value: "MRS", label: "Mrs." },
  { value: "MISS", label: "Miss" },
  { value: "MASTER", label: "Master" },
];

export function formatNamePrefix(prefix) {
  const found = NAME_PREFIXES.find((p) => p.value === prefix);
  return found?.label ?? prefix ?? "";
}
