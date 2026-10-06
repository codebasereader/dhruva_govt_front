import { useMemo } from "react";
import { getGroupedNavItemsForRole } from "../config/navigation";
import { useAuth } from "./useAuth";

/** Returns { mainItems, moreItems } for the current user's role. */
export function useNavItems() {
  const { role } = useAuth();

  return useMemo(() => getGroupedNavItemsForRole(role), [role]);
}
