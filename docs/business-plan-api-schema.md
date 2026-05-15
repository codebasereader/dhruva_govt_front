# Business Plan API — Backend Schema Specification

This document describes the REST API contract expected by the Dhruva Government frontend **Business Plan** calendar (`/owner/business-plan`).

**Base URL:** `{API_BASE_URL}` (e.g. `https://…/api/`)  
**Auth:** `Authorization: Bearer <JWT>` on all endpoints  
**Content-Type:** `application/json`

**Standard envelope (recommended):**

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

## 1. Event entity

### 1.1 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (ObjectId) | yes (response) | Unique event ID |
| `eventName` | string | yes | Display name on calendar |
| `date` | string (ISO date) | yes | Event date `YYYY-MM-DD` |
| `belongsTo` | enum | yes | `"district"` \| `"department"` |
| `districtId` | string \| null | conditional | Required when `belongsTo === "district"` |
| `departmentId` | string \| null | conditional | Required when `belongsTo === "department"` |
| `eventType` | enum | yes | `"MCA"` \| `"TENDER"` \| `"FORGI_DC"` |
| `createdAt` | datetime | optional | Audit |
| `updatedAt` | datetime | optional | Audit |

### 1.2 Enums

**`belongsTo`**

- `district` — event is tied to a district
- `department` — event is tied to a department

**`eventType`** (calendar colours on UI)

| Value | UI label | Colour |
|-------|----------|--------|
| `MCA` | MCA | Blue |
| `TENDER` | Tender | Red |
| `FORGI_DC` | Department Forgi / DC Forgi | Yellow |

### 1.3 Validation rules

1. `eventName` — non-empty, max 200 chars recommended  
2. `date` — valid `YYYY-MM-DD`  
3. If `belongsTo === "district"`: `districtId` required, `departmentId` must be `null`  
4. If `belongsTo === "department"`: `departmentId` required, `districtId` must be `null`  
5. `districtId` / `departmentId` must reference existing records  
6. `eventType` must be one of the enum values above  

### 1.4 Example document

```json
{
  "id": "674a1b2c3d4e5f6789012345",
  "eventName": "Quarterly MCA Review",
  "date": "2026-05-15",
  "belongsTo": "district",
  "districtId": "674a00000000000000000001",
  "departmentId": null,
  "eventType": "MCA",
  "createdAt": "2026-05-15T10:00:00.000Z",
  "updatedAt": "2026-05-15T10:00:00.000Z"
}
```

### 1.5 Populated response (optional)

For list/detail, optionally embed names for UI:

```json
{
  "id": "…",
  "eventName": "…",
  "date": "2026-05-15",
  "belongsTo": "department",
  "districtId": null,
  "departmentId": "674b…",
  "eventType": "TENDER",
  "districtName": null,
  "departmentName": "Finance Department"
}
```

---

## 2. Endpoints

Resource path: **`/business-plans`**

### 2.1 List events

```http
GET /business-plans
```

**Query parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | Tab filter: `all` \| `district` \| `department` |
| `month` | string | yes | Calendar month `YYYY-MM` (e.g. `2026-05`) |
| `districtId` | string | no | Filter by district ID |
| `departmentId` | string | no | Filter by department ID |

**`type` behaviour**

| Value | Expected filter |
|-------|-----------------|
| `all` | All events in month (respect optional `districtId` / `departmentId`) |
| `district` | Only events where `belongsTo === "district"` (respect filters) |
| `department` | Only events where `belongsTo === "department"` (respect filters) |

**Example**

```http
GET /business-plans?type=all&month=2026-05&districtId=674a00000000000000000001
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "674a1b2c3d4e5f6789012345",
      "eventName": "MCA Submission",
      "date": "2026-05-10",
      "belongsTo": "district",
      "districtId": "674a00000000000000000001",
      "departmentId": null,
      "eventType": "MCA"
    }
  ]
}
```

---

### 2.2 Get event by ID

```http
GET /business-plans/{id}
```

**Response `200`:** single event in `data` (object).

**Response `404`:** event not found.

---

### 2.3 Create event

```http
POST /business-plans
```

**Request body**

```json
{
  "eventName": "Staff Admin",
  "date": "2026-05-20",
  "belongsTo": "department",
  "districtId": null,
  "departmentId": "674b00000000000000000002",
  "eventType": "FORGI_DC"
}
```

**Response `201`:** created event in `data`.

**Response `400`:** validation error.

```json
{
  "success": false,
  "message": "departmentId is required when belongsTo is department"
}
```

---

### 2.4 Update event

```http
PUT /business-plans/{id}
```

**Request body:** same shape as create (partial updates optional if you prefer PATCH semantics).

**Response `200`:** updated event in `data`.

**Response `404`:** not found.

---

### 2.5 Delete event

```http
DELETE /business-plans/{id}
```

**Response `200` or `204`:** success.

**Response `404`:** not found.

---

## 3. Related resources (existing)

The frontend loads dropdowns from:

| Resource | Endpoint |
|----------|----------|
| Districts | `GET /districts` |
| Departments | `GET /departments` |

Ensure `id` fields match those used in `districtId` / `departmentId`.

---

## 4. Suggested database schema (MongoDB)

**Collection:** `business_plans`

```javascript
{
  _id: ObjectId,
  eventName: { type: String, required: true, trim: true },
  date: { type: String, required: true }, // YYYY-MM-DD index-friendly
  belongsTo: { type: String, enum: ["district", "department"], required: true },
  districtId: { type: ObjectId, ref: "districts", default: null },
  departmentId: { type: ObjectId, ref: "departments", default: null },
  eventType: { type: String, enum: ["MCA", "TENDER", "FORGI_DC"], required: true },
  createdBy: { type: ObjectId, ref: "users" },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes (recommended)**

```javascript
db.business_plans.createIndex({ date: 1 });
db.business_plans.createIndex({ date: 1, belongsTo: 1 });
db.business_plans.createIndex({ districtId: 1, date: 1 });
db.business_plans.createIndex({ departmentId: 1, date: 1 });
```

**Pre-save hook:** enforce district vs department mutual exclusivity per validation rules in §1.3.

---

## 5. Error format

```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": []
}
```

HTTP status codes: `400` validation, `401` unauthorized, `404` not found, `500` server error.

---

## 6. Frontend file reference

| Purpose | Path |
|---------|------|
| API client | `src/api/buisnessplan.js` |
| Calendar page | `src/dashboard/owner/buisnessplan/BusinessPlanCalendar.jsx` |
| Event wizard (modal) | `src/dashboard/owner/buisnessplan/EventWizard.jsx` |
| Constants | `src/constants/businessPlan.js` |

---

## 7. Changelog

| Date | Notes |
|------|-------|
| 2026-05-15 | Initial schema for Business Plan calendar MVP |
