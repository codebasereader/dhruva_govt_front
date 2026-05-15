import { useEffect, useRef } from "react";
import { decodeToken } from "react-jwt";
import { useDispatch, useSelector } from "react-redux";
import { getUserFromToken } from "../../api/auth";
import { setAuthToken } from "../../api/client";
import { logout, updateUser } from "../../reducers/user";
import verifyToken from "../../utils/verifyToken";

function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { is_logged_in, access_token, name, email_id } = useSelector(
    (state) => state.user.value,
  );
  const expiryTimerRef = useRef(null);

  useEffect(() => {
    if (!is_logged_in || !access_token) {
      setAuthToken(null);
      return;
    }

    setAuthToken(access_token);

    const { status } = verifyToken(access_token);
    if (!status) {
      dispatch(logout());
      setAuthToken(null);
      return;
    }

    try {
      const fromToken = getUserFromToken(access_token);
      dispatch(
        updateUser({
          id: fromToken._id,
          name: name || fromToken.name,
          email_id: fromToken.email || email_id,
          role: fromToken.role,
          is_logged_in: true,
        }),
      );
    } catch {
      dispatch(logout());
      setAuthToken(null);
      return;
    }

    try {
      const decoded = decodeToken(access_token);
      const exp = decoded?.exp;

      if (typeof exp === "number") {
        const msUntilExpiry = exp * 1000 - Date.now();
        const logoutMs = Math.min(msUntilExpiry - 1000, 2147483647);

        if (logoutMs > 0) {
          expiryTimerRef.current = setTimeout(() => {
            dispatch(logout());
            setAuthToken(null);
            window.location.href = "/login";
          }, logoutMs);
        }
      }
    } catch {
      // Token already verified above
    }

    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    };
  }, [
    dispatch,
    is_logged_in,
    access_token,
    name,
    email_id,
  ]);

  return children;
}

export default AuthInitializer;
