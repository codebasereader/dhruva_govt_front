import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getDefaultPathForRole } from "../../config/navigation";

function GuestRoute() {
  const { isLoggedIn, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fafafa] text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  if (isLoggedIn) {
    return <Navigate to={getDefaultPathForRole(role)} replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
