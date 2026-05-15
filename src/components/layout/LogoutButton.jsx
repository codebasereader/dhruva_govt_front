import { memo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuthToken } from "../../api/client";
import { logout } from "../../reducers/user";
import { cn } from "../../utils/cn";

function LogoutButton({ className, onAfterLogout }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    dispatch(logout());
    setAuthToken(null);
    onAfterLogout?.();
    navigate("/login", { replace: true });
  }, [dispatch, navigate, onAfterLogout]);

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        "cursor-pointer rounded-full px-3.5 py-2 text-sm font-medium text-red-400 transition-colors",
        "hover:bg-red-50 hover:text-red-600",
        "outline-none focus-visible:ring-2 focus-visible:ring-red-300/60 focus-visible:ring-offset-2",
        className,
      )}
    >
      Logout
    </button>
  );
}

export default memo(LogoutButton);
