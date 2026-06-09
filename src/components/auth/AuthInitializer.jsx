import { useEffect, useRef } from "react";
import { decodeToken, isExpired } from "react-jwt";
import { useDispatch, useSelector } from "react-redux";
import { getUserFromToken, refreshAuth } from "../../api/auth";
import { setAuthToken } from "../../api/client";
import { logout, setLoading, updateUser } from "../../reducers/user";
import verifyToken from "../../utils/verifyToken";

function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { is_logged_in, access_token, refresh_token, name, email_id } = useSelector(
    (state) => state.user.value,
  );
  const expiryTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const clearExpiryTimer = () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
    };

    const scheduleExpiryLogout = (token) => {
      clearExpiryTimer();
      try {
        const decoded = decodeToken(token);
        const exp = decoded?.exp;
        if (typeof exp !== "number") return;

        const msUntilExpiry = exp * 1000 - Date.now();
        const logoutMs = Math.min(msUntilExpiry - 1000, 2147483647);

        if (logoutMs > 0) {
          expiryTimerRef.current = setTimeout(() => {
            dispatch(logout());
            setAuthToken(null);
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
          }, logoutMs);
        }
      } catch {
        // ignore decode errors
      }
    };

    const applySession = (token, refreshTokenValue) => {
      setAuthToken(token);
      const fromToken = getUserFromToken(token);
      dispatch(
        updateUser({
          id: fromToken._id,
          name: name || fromToken.name,
          email_id: fromToken.email || email_id,
          role: fromToken.role,
          access_token: token,
          refresh_token: refreshTokenValue,
          is_logged_in: true,
        }),
      );
      scheduleExpiryLogout(token);
    };

    async function bootstrap() {
      clearExpiryTimer();

      if (!is_logged_in) {
        setAuthToken(null);
        dispatch(setLoading(false));
        return;
      }

      dispatch(setLoading(true));

      let token = access_token;
      let nextRefreshToken = refresh_token;

      try {
        if (!token || isExpired(token)) {
          if (!nextRefreshToken) {
            dispatch(logout());
            setAuthToken(null);
            return;
          }

          const refreshed = await refreshAuth(nextRefreshToken);
          if (cancelled) return;

          token = refreshed.access_token;
          nextRefreshToken = refreshed.refresh_token;
        }

        const { status } = verifyToken(token);
        if (!status) {
          dispatch(logout());
          setAuthToken(null);
          return;
        }

        if (cancelled) return;
        applySession(token, nextRefreshToken);
      } catch {
        if (!cancelled) {
          dispatch(logout());
          setAuthToken(null);
        }
      } finally {
        if (!cancelled) {
          dispatch(setLoading(false));
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      clearExpiryTimer();
    };
  }, [dispatch, is_logged_in, access_token, refresh_token, name, email_id]);

  return children;
}

export default AuthInitializer;
