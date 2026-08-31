import { Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute, OwnerRoute } from "../components/auth/RoleRoute";
import GuestRoute from "../components/auth/GuestRoute";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PagePlaceholder from "../components/common/PagePlaceholder";
import {
  getDefaultPathForRole,
  getRoutedOwnerOnlyNavItems,
} from "../config/navigation";
import ActualPlan from "../dashboard/owner/actualplan";
import BusinessPlan from "../dashboard/owner/buisnessplan";
import Calendar from "../dashboard/owner/calendar";
import MyLeads from "../dashboard/owner/myleads";
import WedLeads from "../dashboard/owner/wedleads";
import Departments from "../dashboard/admin/Departments";
import Districts from "../dashboard/admin/Districts";
import Database from "../dashboard/admin/Database";
import Venues from "../dashboard/admin/Venues";
import Users from "../dashboard/admin/Users";
import { useAuth } from "../hooks/useAuth";
import AppLayout from "../pages/layout/AppLayout";
import Login from "../pages/login/Login";

const OWNER_PLACEHOLDER_PATHS = new Set([
  "/owner/actual-plan",
  "/owner/business-plan",
  "/owner/calendar",
  "/owner/my-leads",
  "/owner/wed-leads",
]);

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

          {/* Districts, departments & venues — shared by admin and owner */}
          <Route path="admin/districts" element={<Districts />} />
          <Route path="admin/departments" element={<Departments />} />
          <Route path="admin/venues" element={<Venues />} />
          <Route path="admin/database" element={<Database />} />

          <Route element={<OwnerRoute />}>
            <Route path="owner/calendar" element={<Calendar />} />
            <Route path="owner/actual-plan" element={<ActualPlan />} />
            <Route path="owner/wed-leads" element={<WedLeads />} />
            <Route path="owner/my-leads" element={<MyLeads />} />
            <Route path="owner/business-plan" element={<BusinessPlan />} />
            {getRoutedOwnerOnlyNavItems()
              .filter((item) => !OWNER_PLACEHOLDER_PATHS.has(item.path))
              .map(({ label, path }) => (
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
