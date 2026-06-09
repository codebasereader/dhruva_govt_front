import { refreshAuth } from "./auth";
import { setAuthToken } from "./client";
import { logout, updateUser } from "../reducers/user";

let isRefreshing = false;
let refreshWaiters = [];

function resolveRefreshWaiters(error, accessToken = null) {
  refreshWaiters.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(accessToken);
  });
  refreshWaiters = [];
}

function waitForRefresh() {
  return new Promise((resolve, reject) => {
    refreshWaiters.push({ resolve, reject });
  });
}

function forceLogout(store) {
  store.dispatch(logout());
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

function isAuthRoute(url = "") {
  return /auth\/(login|register|refresh)(\?|$|\/)/.test(url);
}

export function setupAuthInterceptor(apiClient, store) {
  apiClient.interceptors.response.use(
    (res) => res,
    async (err) => {
      const status = err.response?.status;
      const originalRequest = err.config;

      if (status !== 401 || !originalRequest || originalRequest._retry) {
        return Promise.reject(err);
      }

      const url = originalRequest.url ?? "";
      if (isAuthRoute(url)) {
        return Promise.reject(err);
      }

      const { refresh_token: refreshToken, is_logged_in: isLoggedIn } =
        store.getState().user.value;

      if (!isLoggedIn || !refreshToken) {
        forceLogout(store);
        return Promise.reject(err);
      }

      if (isRefreshing) {
        try {
          const newToken = await waitForRefresh();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          return Promise.reject(refreshErr);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { access_token, refresh_token, user } = await refreshAuth(refreshToken);
        store.dispatch(
          updateUser({
            access_token,
            refresh_token,
            is_logged_in: true,
            ...(user?._id ? { id: user._id } : {}),
            ...(user?.name ? { name: user.name } : {}),
            ...(user?.email ? { email_id: user.email } : {}),
            ...(user?.role ? { role: user.role } : {}),
          }),
        );
        setAuthToken(access_token);
        resolveRefreshWaiters(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        resolveRefreshWaiters(refreshErr);
        forceLogout(store);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    },
  );
}
