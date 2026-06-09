import { decodeToken } from "react-jwt";
import apiClient from "./client";
import { getApiErrorMessage, unwrapApiPayload } from "./utils";

export async function login(credentials) {
  const { data } = await apiClient.post("auth/login", credentials);

  if (data && typeof data === "object" && data.success === false) {
    const err = new Error("Login failed");
    err.response = {
      data: {
        error: data.error,
        message: data.error?.message ?? data.message,
      },
    };
    throw err;
  }

  return normalizeAuthResponse(data);
}

/**
 * Exchange a refresh token for a new access token (and optional new refresh token).
 * POST /auth/refresh
 */
export async function refreshAuth(refreshToken) {
  if (!refreshToken?.trim()) {
    throw new Error("No refresh token");
  }

  const { data } = await apiClient.post("auth/refresh", {
    refresh_token: refreshToken,
    refreshToken: refreshToken,
  });

  if (data && typeof data === "object" && data.success === false) {
    const err = new Error("Token refresh failed");
    err.response = { data };
    throw err;
  }

  const normalized = normalizeAuthResponse(data);
  return {
    ...normalized,
    refresh_token: normalized.refresh_token || refreshToken,
  };
}

/** Resolve user profile from JWT only (no /auth/me). */
export function getUserFromToken(token) {
  const decoded = decodeToken(token);
  if (!decoded) {
    throw new Error("Invalid token");
  }

  return normalizeUser({
    _id: decoded.userId ?? decoded.sub ?? decoded.id ?? decoded._id,
    name: decoded.name ?? "",
    email: decoded.email ?? "",
    role: decoded.role,
  });
}

function normalizeAuthResponse(response) {
  const payload = unwrapApiPayload(response);

  const access_token =
    payload.token ??
    payload.access_token ??
    payload.accessToken ??
    payload.jwt;

  if (!access_token) {
    throw new Error("Login response did not include a token");
  }

  const decoded = decodeToken(access_token);
  const user = normalizeUser(
    payload.user ??
      (decoded
        ? {
            _id: decoded.userId ?? decoded.sub ?? decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
          }
        : {}),
  );

  return {
    access_token,
    refresh_token:
      payload.refresh_token ??
      payload.refreshToken ??
      payload.refresh ??
      "",
    user,
  };
}

function normalizeUser(user) {
  return {
    _id: user._id ?? user.id ?? user.sub ?? user.userId ?? "",
    name: user.name ?? "",
    email: user.email ?? user.email_id ?? "",
    role: String(user.role ?? "").toLowerCase(),
  };
}

export { getApiErrorMessage };
