# My Leads API — Backend Schema Specification

REST + MongoDB contract for the Dhruva Government frontend **My leads** page (`/owner/my-leads`).

> Personal owner leads with meeting status and a list of meetings. Separate from Wed-Leads (future) and Business Plan events.

- Frontend route: `/owner/my-leads`
- API resource: `/my-leads`
- Collection: `my_leads`

**Base URL:** `{API_BASE_URL}` (see `config.js` — do not change without product request)  
**Auth:** `Authorization: Bearer <JWT>` on all endpoints  
**Content-Type:** `application/json`

**Standard envelope:**

```json
{
  "success": true,
  "data": { }
}
```

For lists:

```json
{
  "success": true,
  "data": [ ]
}
```

---

## 1. Access control

| Rule | Detail |
|------|--------|
| Allowed roles | `owner` only (403 for `admin` and others) |
| Ownership | Every lead is scoped to the authenticated user (`userId` from JWT) |
| List / get / update / delete | Only documents where `userId === req.user.id` |
| Never trust client `userId` | Ignore body `userId`; always set from token |

---

## 2. Lead entity

### 2.1 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (ObjectId) | yes (response) | Unique lead ID. Map `_id` → `id` in JSON. |
| `userId` | string (ObjectId) | yes | Owner from JWT |
| `clientName` | string | yes | Client display name (max 200) |
| `phoneNumber` | string | yes | Primary phone (max 20 recommended) |
| `alternativeNumber` | string \| null | no | Optional alternate phone; store `null` when empty |
| `meetingStatus` | enum | yes | Overall lead meeting status (see §2.2). Default `PENDING` |
| `meetings` | array | yes | List of meeting entries (see §2.3). At least one with a date on create |
| `createdAt` | datetime | yes | Audit |
| `updatedAt` | datetime | yes | Audit |

### 2.2 Meeting status enum

| Value | UI label |
|-------|----------|
| `PENDING` | Pending |
| `CONFIRMED` | Confirmed |
| `REJECTED` | Rejected |

Reject any other value with `400`.

### 2.3 Meeting sub-document

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` / `_id` | string (ObjectId) | yes (response) | Optional but recommended for stable edit tracking |
| `meetingDate` | string (ISO date) | yes | `YYYY-MM-DD` |
| `meetingNotes` | string \| null | no | Free-text notes; empty → `null` (max 2000) |

A lead may have **many** meetings. Order in responses: `meetingDate` descending (newest first), then `createdAt` if needed.

### 2.4 Validation rules

1. `clientName` — trim; non-empty; max 200  
2. `phoneNumber` — trim; non-empty; max 20 (digits / `+` / spaces / `-` allowed)  
3. `alternativeNumber` — optional; same format rules when present; empty → `null`  
4. `meetingStatus` — one of `PENDING` \| `CONFIRMED` \| `REJECTED`  
5. `meetings` — array; on create must contain **≥ 1** item with valid `meetingDate`  
6. Each `meetingDate` — valid `YYYY-MM-DD`  
7. Each `meetingNotes` — optional; trim; empty → `null`; max 2000  
8. Do not accept nested unknown fields that collide with ownership

### 2.5 Example document

```json
{
  "id": "68b01a2b3c4d5e6f70890123",
  "userId": "6a06f9b708da0e4c320f3de0",
  "clientName": "Priya Sharma",
  "phoneNumber": "9876543210",
  "alternativeNumber": "9123456780",
  "meetingStatus": "PENDING",
  "meetings": [
    {
      "id": "68b01a2b3c4d5e6f70890124",
      "meetingDate": "2026-09-02",
      "meetingNotes": "Initial venue discussion"
    },
    {
      "id": "68b01a2b3c4d5e6f70890125",
      "meetingDate": "2026-08-20",
      "meetingNotes": null
    }
  ],
  "createdAt": "2026-08-28T10:00:00.000Z",
  "updatedAt": "2026-08-28T10:00:00.000Z"
}
```

---

## 3. MongoDB schema

**Collection:** `my_leads`

```js
{
  _id: ObjectId,
  userId: ObjectId,           // ref: users
  clientName: String,
  phoneNumber: String,
  alternativeNumber: String | null,
  meetingStatus: String,      // PENDING | CONFIRMED | REJECTED
  meetings: [
    {
      _id: ObjectId,
      meetingDate: String,     // YYYY-MM-DD
      meetingNotes: String | null
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### 3.1 Mongoose sketch

```js
const MEETING_STATUSES = ["PENDING", "CONFIRMED", "REJECTED"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const meetingSchema = new mongoose.Schema(
  {
    meetingDate: { type: String, required: true, match: DATE_RE },
    meetingNotes: { type: String, default: null, trim: true, maxlength: 2000 },
  },
  { _id: true }
);

const myLeadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientName: { type: String, required: true, trim: true, maxlength: 200 },
    phoneNumber: { type: String, required: true, trim: true, maxlength: 20 },
    alternativeNumber: { type: String, default: null, trim: true, maxlength: 20 },
    meetingStatus: {
      type: String,
      enum: MEETING_STATUSES,
      default: "PENDING",
      required: true,
    },
    meetings: {
      type: [meetingSchema],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: "At least one meeting is required",
      },
    },
  },
  { timestamps: true }
);

myLeadSchema.pre("validate", function clearAlt() {
  if (!this.alternativeNumber) this.alternativeNumber = null;
});
```

Serialize `_id` → `id` on lead and each meeting (same as other resources).

### 3.2 Indexes

```js
{ userId: 1, createdAt: -1 }
{ userId: 1, meetingStatus: 1 }
{ userId: 1, clientName: 1 }
{ userId: 1, phoneNumber: 1 }
```

Text / regex search on `clientName`, `phoneNumber`, `alternativeNumber` is fine for v1.

---

## 4. Endpoints

Resource path: **`/my-leads`**

### 4.1 List leads

```http
GET /my-leads
```

**Query params**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | no | Case-insensitive match on `clientName`, `phoneNumber`, or `alternativeNumber` |
| `meetingStatus` | enum | no | Filter by `PENDING` \| `CONFIRMED` \| `REJECTED` |

**Behaviour**

- Scope to `userId` from JWT  
- Apply filters when provided  
- Sort: `updatedAt` descending (or `createdAt` descending)

**Response `200`**

```json
{
  "success": true,
  "data": [ /* lead objects */ ]
}
```

### 4.2 Get one lead

```http
GET /my-leads/:id
```

**Response `200`** — single lead in `data`  
**Response `404`** — missing or not owned

### 4.3 Create lead

```http
POST /my-leads
```

**Request body**

```json
{
  "clientName": "Priya Sharma",
  "phoneNumber": "9876543210",
  "alternativeNumber": "9123456780",
  "meetingStatus": "PENDING",
  "meetings": [
    {
      "meetingDate": "2026-09-02",
      "meetingNotes": "Initial venue discussion"
    }
  ]
}
```

Omit `alternativeNumber` or send `null` / `""` when unused.

**Response `201`** — created lead in `data`  
**Response `400`** — validation errors

### 4.4 Update lead

```http
PUT /my-leads/:id
```

Same body shape as create (full replace of editable fields including `meetings` array is preferred for v1).

**Rules**

- Only owner may update  
- Replacing `meetings` replaces the embedded array (generate new `_id`s for new rows; keep existing `_id` when client sends `id` if you support stable ids)

**Response `200`** — updated lead  
**Response `404`** — missing / not owned

### 4.5 Delete lead

```http
DELETE /my-leads/:id
```

**Response `200`**

```json
{
  "success": true,
  "data": { "id": "68b01a2b3c4d5e6f70890123" }
}
```

**Response `404`** — missing / not owned

Frontend shows **two** confirmation dialogs before calling this endpoint.

---

## 5. Error envelope

```json
{
  "success": false,
  "message": "Client name is required."
}
```

Or:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "At least one meeting is required"
  }
}
```

HTTP: `400` validation, `401` auth, `403` forbidden, `404` missing, `500` server.

---

## 6. Frontend mapping

| UI | API |
|----|-----|
| Table load + search + status filter | `GET /my-leads?search=&meetingStatus=` |
| Add lead (75% right drawer) | `POST /my-leads` |
| Edit lead | `PUT /my-leads/:id` |
| Delete (after double confirm) | `DELETE /my-leads/:id` |

Client module: `src/api/myLeads.js`

---

## 7. Suggested backend checklist

- [ ] `my_leads` collection + indexes  
- [ ] Auth + owner-only middleware  
- [ ] Scope all queries by JWT `userId`  
- [ ] CRUD under `/my-leads`  
- [ ] Validate status enum + meetings array  
- [ ] Search + `meetingStatus` query filters  
- [ ] Same success/error envelope as other APIs  

---

## 8. Changelog

| Date | Note |
|------|------|
| 2026-08-28 | Initial My leads schema: `/my-leads`, embedded `meetings[]`, status filter + search |
