import { useMemo } from "react";
import { getNavItemsForRole } from "../config/navigation";
import { useAuth } from "./useAuth";

export function useNavItems() {
  const { role } = useAuth();

  return useMemo(() => getNavItemsForRole(role), [role]);
}
