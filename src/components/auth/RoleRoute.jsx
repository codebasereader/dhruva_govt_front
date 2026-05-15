import { Navigate, Outlet } from "react-router-dom";
import { ROLES } from "../../../config.js";
import { getDefaultPathForRole } from "../../config/navigation";
import { useAuth } from "../../hooks/useAuth";

function RoleRoute({ allowedRoles }) {
  const { role, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = String(role ?? "").toLowerCase();

  if (!allowedRoles.includes(normalizedRole)) {
    return <Navigate to={getDefaultPathForRole(role)} replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  return <RoleRoute allowedRoles={[ROLES.Admin]} />;
}

export function OwnerRoute() {
  return <RoleRoute allowedRoles={[ROLES.Owner]} />;
}

export default RoleRoute;
