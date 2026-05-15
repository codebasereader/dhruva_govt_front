import { Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute, OwnerRoute } from "../components/auth/RoleRoute";
import GuestRoute from "../components/auth/GuestRoute";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PagePlaceholder from "../components/common/PagePlaceholder";
import { getDefaultPathForRole, OWNER_ONLY_NAV_ITEMS } from "../config/navigation";
import BusinessPlan from "../dashboard/owner/buisnessplan";
import Departments from "../dashboard/admin/Departments";
import Districts from "../dashboard/admin/Districts";
import Users from "../dashboard/admin/Users";
import { useAuth } from "../hooks/useAuth";
import AppLayout from "../pages/layout/AppLayout";
import Login from "../pages/login/Login";

function HomeRedirect() {
  const { role, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultPathForRole(role)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeRedirect />} />

          {/* Districts & departments — shared by admin and owner */}
          <Route path="admin/districts" element={<Districts />} />
          <Route path="admin/departments" element={<Departments />} />

          <Route element={<OwnerRoute />}>
            <Route path="owner/business-plan" element={<BusinessPlan />} />
            {OWNER_ONLY_NAV_ITEMS.filter(
              (item) => item.path !== "/owner/business-plan",
            ).map(({ label, path }) => (
              <Route
                key={path}
                path={path.replace(/^\//, "")}
                element={<PagePlaceholder title={label} />}
              />
            ))}
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="admin/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
