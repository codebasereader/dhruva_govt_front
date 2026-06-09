# Auth API — Backend Schema Specification

REST contract for login, token refresh, and session persistence used by the Dhruva Government frontend.

**Base URL:** `{API_BASE_URL}` (see `config.js`)  
**Content-Type:** `application/json`

**Standard envelope:**

```json
{
  "success": true,
  "data": { }
}
```

---

## 1. Login

```http
POST /auth/login
```

**Request body**

```json
{
  "email": "dhruva@gmail.com",
  "password": "string"
}
```

**Response `200` (current shape)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6a06f9b708da0e4c320f3de0",
      "name": "Owner",
      "email": "dhruva@gmail.com",
      "role": "owner",
      "isActive": true,
      "createdAt": "2026-05-15T10:47:19.788Z",
      "updatedAt": "2026-05-15T10:47:19.788Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response `200` (with refresh token — required for long sessions)**

Add `refresh_token` (or `refreshToken`) alongside `token` inside `data`:

```json
{
  "success": true,
  "data": {
    "user": { "id": "…", "name": "…", "email": "…", "role": "owner" },
    "token": "eyJ…",
    "refresh_token": "opaque-or-jwt-refresh-string"
  }
}
```

| Field | Notes |
|-------|--------|
| `token` | JWT access token (~24h expiry in current tokens). Frontend maps this to `access_token` in Redux / `localStorage`. |
| `refresh_token` | Long-lived token. Stored in Redux + `localStorage` key `government_user`. **Without this, users are logged out after access token expires (~24h) on page refresh.** |
| `user.id` | Stored as `id` in client state |
| `user.email` | Stored as `email_id` in client state |
| `user.role` | `admin` or `owner` (lowercase) |

**JWT access token claims (decoded on client):**

| Claim | Example |
|-------|---------|
| `userId` | `6a06f9b708da0e4c320f3de0` |
| `email` | `dhruva@gmail.com` |
| `role` | `owner` |
| `exp` | Unix expiry |

---

## 2. Refresh access token

Used automatically when:

- The app loads with an **expired** access token but a valid `refresh_token` in storage
- Any API call returns **401** (interceptor retries once after refresh)

```http
POST /auth/refresh
```

**Request body** (frontend sends both keys for compatibility)

```json
{
  "refresh_token": "string",
  "refreshToken": "string"
}
```

**Response `200`**

Same envelope as login. Must include a new `token`. Should return a new `refresh_token` if rotating refresh tokens.

```json
{
  "success": true,
  "data": {
    "token": "eyJ…",
    "refresh_token": "…",
    "user": { "id": "…", "name": "…", "email": "…", "role": "owner" }
  }
}
```

`user` is optional on refresh; the client can keep the existing profile and only update tokens.

**Response `401`:** refresh invalid/expired → client clears session and redirects to `/login`.

---

## 3. Frontend session storage

| Key | Location | Contents |
|-----|----------|----------|
| `government_user` | `localStorage` | `{ value: { id, name, role, email_id, access_token, refresh_token, is_logged_in, … } }` |

On each Redux update, the full `user.value` object is persisted.

---

## 4. Frontend file reference

| Area | Path |
|------|------|
| Login API | `src/api/auth.js` |
| 401 refresh interceptor | `src/api/authInterceptor.js` |
| Bootstrap on load | `src/components/auth/AuthInitializer.jsx` |
| Persist + interceptor setup | `src/main.jsx` |
| Login page | `src/pages/login/Login.jsx` |
| Token role check | `src/utils/verifyToken.js` |

---

## 5. Backend checklist

- [x] `POST /auth/login` → `{ success, data: { user, token, refresh_token } }`
- [x] `refresh_token` returned on login (opaque string; stored client-side)
- [ ] `POST /auth/refresh` accepts `refresh_token` and returns new `token` (required for session restore after access JWT expires)
- [ ] Return new `token` (+ optional rotated `refresh_token`) from refresh
- [x] Access token `role` claim: `admin` \| `owner`
- [x] Access token `userId` claim matches `user.id`
- [x] Access token includes `type: "access"` (optional; client ignores)

---

## 6. Client state example (after login — `localStorage` key `government_user`)

```json
{
  "value": {
    "id": "6a06f9b708da0e4c320f3de0",
    "name": "Owner",
    "role": "owner",
    "email_id": "dhruva@gmail.com",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
    "refresh_token": "b9923bc5b509332dee116b135516fe8090a4946634b35c5f92ba9c779e22307a1a35c226449fb142d7f19a0b40f96026",
    "is_change_password": false,
    "is_logged_in": true
  }
}
```

The frontend maps `data.token` → `access_token` and `data.refresh_token` → `refresh_token` automatically. No extra client changes needed for this shape.
