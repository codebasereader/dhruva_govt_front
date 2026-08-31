# Actual Plan API — Backend Schema Specification

This document describes the REST API contract expected by the Dhruva Government frontend **Actual Plan** calendar (`/owner/actual-plan`).

> **Separate from Business Plan:** Actual Plan mirrors Business Plan feature-for-feature, but it is a **different product surface** with its **own REST resource** and **own MongoDB collection**. Do **not** share rows with `business-plans` / `business_plans`.  
> - Frontend route: `/owner/actual-plan` (first owner menu item)  
> - API resource: `/actual-plans`  
> - Collection: `actual_plans`  
> - Parallel Business Plan docs: `docs/business-plan-api-schema.md` (`/business-plans`, `business_plans`)

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
| `startDate` | string (ISO date) | yes | Event start date `YYYY-MM-DD` |
| `endDate` | string (ISO date) | yes | Event end date `YYYY-MM-DD` (inclusive) |
| `date` | string (ISO date) | no (legacy) | Deprecated: use `startDate` / `endDate` |
| `recurrenceType` | enum | yes | `ONE_TIME` \| `YEARLY` |
| `isRecurring` | boolean | yes | `true` when `recurrenceType === "YEARLY"` |
| `recurrenceEndDate` | string (ISO date) \| null | no | Optional last date for yearly recurrence (`YYYY-MM-DD`) |
| `belongsTo` | enum | yes | `"district"` \| `"department"` \| `"both"` |
| `districtId` | string \| null | conditional | Required for `district` and `both` |
| `departmentId` | string \| null | conditional | Required for `department` and `both` |
| `venueId` | string \| null | yes | Reference to `venues` |
| `eventType` | enum | yes | `"MCA"` \| `"TENDER"` \| `"DEPARTMENT_4G"` \| `"DC_4G"` |
| `referredBy` | string \| null | no | Optional; after previous year amount in UI |
| `previousYearAmount` | number \| null | yes | Reference / comparison amount |
| `currentYearAmount` | number | yes | Base amount for calculations |
| `gstRate` | number | yes | `5` or `18` (percent) |
| `mcaSurchargePercent` | number | yes | `5` when MCA, else `0` |
| `mcaSurchargeAmount` | number | yes | MCA extra 5% on current year (0 for non-MCA) |
| `amountBeforeGst` | number | yes | Current year + MCA surcharge |
| `gstBaseAmount` | number | yes | Amount GST is calculated on (see Amount calculation below) |
| `gstAmount` | number | yes | GST in currency |
| `grandTotal` / `finalAmount` | number | yes | Final payable amount |
| `yearlyAmounts` | array | conditional | Required for `YEARLY`; per-calendar-year amount schedule (see §1.8) |
| `amountsConfigured` | boolean | optional (response) | When listing with `month`/`year`, whether amounts exist for that calendar year |
| `amountCalendarYear` | number | optional (response) | Calendar year used to resolve amounts |
| `createdAt` | datetime | optional | Audit |
| `updatedAt` | datetime | optional | Audit |

### 1.2 Enums

**`belongsTo`**

- `district` — event is tied to a district only
- `department` — event is tied to a department only
- `both` — event requires both `districtId` and `departmentId`

**`eventType`** (calendar colours on UI)

| Value | UI label | Colour |
|-------|----------|--------|
| `MCA` | MCA | Blue |
| `TENDER` | Tender | Red |
| `DEPARTMENT_4G` | Department 4(g) | Yellow |
| `DC_4G` | DC (4g) | Amber |
| `FORGI_DC` | *(legacy)* Department Forgi / DC Forgi | Yellow |

**`recurrenceType`**

| Value | UI label | Description |
|-------|----------|-------------|
| `ONE_TIME` | One-time event | Shown only for the stored `startDate`–`endDate` range |
| `YEARLY` | Recurring yearly event | Same month/day pattern repeats every year on the calendar |

### 1.3 Validation rules

1. `eventName` — non-empty, max 200 chars recommended  
2. `startDate` — valid `YYYY-MM-DD`  
3. `endDate` — valid `YYYY-MM-DD` and `endDate >= startDate`  
4. If `belongsTo === "district"`: `districtId` required, `departmentId` must be `null`  
5. If `belongsTo === "department"`: `departmentId` required, `districtId` must be `null`  
6. If `belongsTo === "both"`: both `districtId` and `departmentId` required  
7. `venueId` required and must reference an existing venue from the global venues list  
8. `districtId` / `departmentId` must reference existing records  
9. `eventType` must be one of the enum values above  
10. Amount fields required for every event (see Amount calculation below)  
11. `recurrenceType` must be `ONE_TIME` or `YEARLY`  
12. `isRecurring` must be `true` when `recurrenceType === "YEARLY"`, else `false`  
13. If `recurrenceEndDate` is set: valid `YYYY-MM-DD` and `recurrenceEndDate >= endDate`  
14. If `recurrenceType === "YEARLY"`: `yearlyAmounts` must be a non-empty array after first save; each `year` unique  
15. Each `yearlyAmounts[].year` must be `>=` anchor year (`startDate` year) and `<= recurrenceEndDate` year when set  

### Amount calculation (frontend + backend should match)

Let `C` = `currentYearAmount`, `G` = `gstRate` (5 or 18).

**Non-MCA (`TENDER`, `DEPARTMENT_4G`, `DC_4G`):**

```
mcaSurchargeAmount = 0
amountBeforeGst = C
gstBaseAmount = C
gstAmount = C × (G / 100)
finalAmount = C + gstAmount
```

**MCA:**

```
mcaSurchargeAmount = C × 0.05
amountBeforeGst = C + mcaSurchargeAmount
gstBaseAmount = amountBeforeGst
gstAmount = amountBeforeGst × (G / 100)
finalAmount = amountBeforeGst + gstAmount
```

`previousYearAmount` is stored for reference; it does not affect `finalAmount`.

### 1.4 Example document

```json
{
  "id": "674a1b2c3d4e5f6789012345",
  "eventName": "Quarterly MCA Review",
  "startDate": "2026-05-15",
  "endDate": "2026-05-15",
  "recurrenceType": "ONE_TIME",
  "isRecurring": false,
  "recurrenceEndDate": null,
  "belongsTo": "district",
  "districtId": "674a00000000000000000001",
  "departmentId": null,
  "eventType": "MCA",
  "createdAt": "2026-05-15T10:00:00.000Z",
  "updatedAt": "2026-05-15T10:00:00.000Z"
}
```

### 1.4a Calendar rendering (start/end date)

- If `startDate === endDate`, the event is shown only on that single day in the calendar.
- If `startDate < endDate`, the same event card appears on **every day** from `startDate` through `endDate` (inclusive).

### 1.4b Recurrence (yearly)

**`ONE_TIME`**

- Render only on days within the stored `startDate`–`endDate` range (same rules as §1.4a).

**`YEARLY`**

- The stored `startDate` / `endDate` define the **anchor** month, day, and span length.
- On each calendar month view, the UI projects that pattern onto the viewed year (e.g. anchor `2026-05-10`–`2026-05-12` also appears as `2027-05-10`–`2027-05-12`, `2028-05-10`–`2028-05-12`, etc.).
- Projection starts from the anchor year onward (`viewedYear >= anchorYear`).
- If `recurrenceEndDate` is empty, recurrence continues indefinitely.
- If `recurrenceEndDate` is set, do not project occurrences after that date.

**List by period**

- `GET /actual-plans?month=YYYY-MM` — one-time events overlapping that month; yearly recurring with anchor in that month.
- `GET /actual-plans?year=YYYY` — all events with any occurrence in that year (frontend groups into 12 month tiles via `groupEventsByMonth`).

### 1.8 Yearly amount schedule (`yearlyAmounts`)

For `recurrenceType === "YEARLY"`, amounts differ per **calendar year**. Store one financial snapshot per year on the same event document.

**Per-year object (`yearlyAmounts[]` item)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | number | yes | Calendar year, e.g. `2026` (unique per event) |
| `previousYearAmount` | number \| null | yes | Reference amount |
| `referredBy` | string \| null | no | May differ per year |
| `currentYearAmount` | number | yes | Base for that calendar year |
| `gstRate` | number | yes | `5` or `18` |
| `mcaSurchargePercent` | number | yes | Same rules as root event |
| `mcaSurchargeAmount` | number | yes | Computed |
| `amountBeforeGst` | number | yes | Computed |
| `gstBaseAmount` | number | yes | Computed |
| `gstAmount` | number | yes | Computed |
| `finalAmount` | number | yes | Computed |

**Example (yearly recurring)**

```json
{
  "recurrenceType": "YEARLY",
  "startDate": "2024-05-10",
  "endDate": "2024-05-12",
  "yearlyAmounts": [
    { "year": 2024, "previousYearAmount": 20000000, "currentYearAmount": 25000000, "gstRate": 18, "finalAmount": 29500000 },
    { "year": 2025, "previousYearAmount": 25000000, "currentYearAmount": 30000000, "gstRate": 18, "finalAmount": 35400000 },
    { "year": 2026, "previousYearAmount": 30000000, "currentYearAmount": 35000000, "gstRate": 5, "finalAmount": 36750000 }
  ]
}
```

**Resolving amounts for calendar display**

When `GET /actual-plans?month=YYYY-MM` or `?year=YYYY`:

1. Determine **calendar year** from query (`month` → year part; `year` → that year).
2. For `ONE_TIME`: use root amount fields.
3. For `YEARLY`: find `yearlyAmounts` where `year === calendarYear`.
4. If found: merge onto event (or return `effectiveAmounts`); set `amountsConfigured: true`.
5. If missing: still return event for date projection; `amountsConfigured: false`; UI shows **“Amounts not set”**.

**Root amount fields (legacy / anchor)**

- On create/update, also populate root `previousYearAmount`, `currentYearAmount`, etc. from the **anchor year** entry (`startDate` year) for backward compatibility.

**Migration**

- Existing `YEARLY` rows with only root amounts: treat as `yearlyAmounts: [{ year: startDateYear, ...rootFields }]`.

**Optional endpoint (single-year edit)**

```http
PUT /actual-plans/{id}/yearly-amounts/{year}
```

Body: same shape as one `yearlyAmounts[]` item. Merges into array without replacing other years.

### 1.5 Event wizard (8 steps)

The create/edit modal (`EventWizard.jsx`) uses this order:

| Step | Title | Fields |
|------|-------|--------|
| 1 | Event details | `eventName`, `startDate`, `endDate` |
| 2 | Recurrence | `recurrenceType`, optional `recurrenceEndDate` |
| 3 | Belongs to | `belongsTo` |
| 4 | Location | `districtId`, `departmentId` (per `belongsTo`) |
| 5 | Venue | `venueId` |
| 6 | Event type | `eventType` |
| 7 | Amounts | One-time: single amount block. Yearly: anchor year on create; multi-year tabs when editing |
| 8 | Review | Confirmation before save |

### 1.6 Populated response (optional)

For list/detail, optionally embed names for UI:

```json
{
  "id": "…",
  "eventName": "…",
  "startDate": "2026-05-15",
  "endDate": "2026-05-15",
  "recurrenceType": "YEARLY",
  "isRecurring": true,
  "recurrenceEndDate": null,
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

Resource path: **`/actual-plans`**

### 2.1 List events (calendar)

```http
GET /actual-plans
```

Used by the Actual Plan **monthly** and **yearly** calendar views. Send **either** `month` **or** `year`, not both.

**Query parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | Tab filter: `all` \| `district` \| `department` |
| `month` | string | conditional | Monthly view: `YYYY-MM` (e.g. `2026-05`). Required when UI is in monthly mode. |
| `year` | string \| number | conditional | Yearly view: `YYYY` (e.g. `2026`). Required when UI is in yearly mode. |
| `districtId` | string | no | Filter by district ID |
| `departmentId` | string | no | Filter by department ID |

**View mode rules (frontend)**

| UI mode | Query sent | Period picker |
|---------|------------|---------------|
| Monthly | `month=YYYY-MM` | User selects **month + year** |
| Yearly | `year=YYYY` | User selects **year only** (no month) |

**Monthly view — backend filter**

- Return events that have at least one calendar day in the requested month:
  - one-time: `startDate`–`endDate` overlaps the month
  - yearly recurring: anchor month matches the requested month (see §1.4b)

**Yearly view — backend filter**

- Return all events that should appear anywhere in the requested calendar year:
  - one-time: `startDate`–`endDate` overlaps any day in `year`
  - yearly recurring: anchor pattern projects into `year` (same rules as §1.4b)

**Effective amounts on list responses**

- Resolve amounts for the query calendar year (see §1.8) so calendar pills and list stats use the correct `finalAmount` per year.
- List drawer `stats.totalCurrentYearAmount` / `totalPreviousYearAmount` must sum **effective** values for the filtered period, not a single root amount on recurring events.

**Examples**

```http
GET /actual-plans?type=all&month=2026-05
GET /actual-plans?type=district&year=2026&districtId=674a00000000000000000001
```

**`type` behaviour**

| Value | Expected filter |
|-------|-----------------|
| `all` | All events in month (respect optional `districtId` / `departmentId`) |
| `district` | Only events where `belongsTo === "district"` (respect filters) |
| `department` | Only events where `belongsTo === "department"` (respect filters) |

**Example**

```http
GET /actual-plans?type=all&month=2026-05&districtId=674a00000000000000000001
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "674a1b2c3d4e5f6789012345",
      "eventName": "MCA Submission",
      "startDate": "2026-05-10",
      "endDate": "2026-05-10",
      "belongsTo": "district",
      "districtId": "674a00000000000000000001",
      "departmentId": null,
      "eventType": "MCA"
    }
  ]
}
```

---

### 2.1b List events (drawer / table)

```http
GET /actual-plans/list
```

Used by the Actual Plan **List** drawer (searchable table + summary stats). Independent of calendar month/year view.

**Query parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | no | Case-insensitive match on `eventName` (and optionally `referredBy`) |
| `startDate` | string | no | Inclusive range start `YYYY-MM-DD` |
| `endDate` | string | no | Inclusive range end `YYYY-MM-DD` |
| `type` | string | no | Tab filter: `all` \| `district` \| `department` |
| `districtId` | string | no | Filter by district ID |
| `departmentId` | string | no | Filter by department ID |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "674a1b2c3d4e5f6789012345",
        "eventName": "MCA Submission",
        "startDate": "2026-05-10",
        "endDate": "2026-05-10",
        "belongsTo": "district",
        "districtId": "674a00000000000000000001",
        "departmentId": null,
        "eventType": "MCA",
        "finalAmount": 105000
      }
    ],
    "stats": {
      "totalEvents": 1,
      "totalAmount": 105000,
      "totalCurrentYearAmount": 100000,
      "totalPreviousYearAmount": 90000
    }
  }
}
```

If `stats` is omitted, the frontend still renders the event rows; totals may show as zero until the backend provides them.

---

### 2.2 Get event by ID

```http
GET /actual-plans/{id}
```

**Response `200`:** single event in `data` (object).

**Response `404`:** event not found.

---

### 2.3 Create event

```http
POST /actual-plans
```

**Request body**

```json
{
  "eventName": "Staff Admin",
  "startDate": "2026-05-20",
  "endDate": "2026-05-20",
  "recurrenceType": "YEARLY",
  "isRecurring": true,
  "recurrenceEndDate": null,
  "belongsTo": "department",
  "districtId": null,
  "departmentId": "674b00000000000000000002",
  "eventType": "DC_4G"
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
PUT /actual-plans/{id}
```

**Request body:** same shape as create (partial updates optional if you prefer PATCH semantics).

**Response `200`:** updated event in `data`.

**Response `404`:** not found.

---

### 2.5 Delete event

```http
DELETE /actual-plans/{id}
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
| Venues | `GET /venues` · `POST /venues` · `PUT /venues/:id` · `DELETE /venues/:id` (global) |

See `src/api/venue.js`. Admin/owner **Venues** page (`/admin/venues`) manages the full list; the actual-plan wizard can also create via POST and refresh GET.

Ensure `id` fields match those used in `districtId` / `departmentId` / `venueId`.

### 3.1 Venues (read-only from Actual Plan UI)

```http
GET /venues
```

Returns all venues (common catalog). No `districtId` or `departmentId` query params.

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "674c00000000000000000001",
      "name": "Main Hall",
      "address": "Block A, City Center"
    }
  ]
}
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Venue ID |
| `name` | string | Optional display name |
| `address` | string | Optional display address |

### 3.2 Create venue (from Actual Plan wizard)

```http
POST /venues
```

**Request body**

```json
{
  "name": "Main Hall",
  "address": "Block A, City Center"
}
```

| Field | Type | Required |
|-------|------|----------|
| `name` | string | yes |
| `address` | string | no |

**Response `201`:** created venue in `data` (same shape as list items). Frontend then calls `GET /venues` to refresh the dropdown and selects the new `id`.

### 3.3 Update venue

```http
PUT /venues/{id}
```

**Request body:** same as create (`name` required, `address` optional).

### 3.4 Delete venue

```http
DELETE /venues/{id}
```

**Response `200` or `204`:** success. Confirm in UI before delete.

---

## 4. Suggested database schema (MongoDB)

**Collection:** `actual_plans`

```javascript
{
  _id: ObjectId,
  eventName: { type: String, required: true, trim: true },
  startDate: { type: String, required: true }, // YYYY-MM-DD index-friendly
  endDate: { type: String, required: true }, // YYYY-MM-DD inclusive
  recurrenceType: { type: String, enum: ["ONE_TIME", "YEARLY"], default: "ONE_TIME", required: true },
  isRecurring: { type: Boolean, default: false, required: true },
  recurrenceEndDate: { type: String, default: null }, // YYYY-MM-DD, optional
  belongsTo: { type: String, enum: ["district", "department", "both"], required: true },
  districtId: { type: ObjectId, ref: "districts", default: null },
  departmentId: { type: ObjectId, ref: "departments", default: null },
  venueId: { type: ObjectId, ref: "venues", required: true },
  eventType: {
    type: String,
    enum: ["MCA", "TENDER", "DEPARTMENT_4G", "DC_4G"],
    required: true,
  },
  referredBy: { type: String, default: null, trim: true },
  previousYearAmount: Number,
  currentYearAmount: { type: Number, required: true },
  gstRate: { type: Number, enum: [5, 18], required: true },
  mcaSurchargePercent: { type: Number, default: 0 },
  mcaSurchargeAmount: { type: Number, default: 0 },
  amountBeforeGst: Number,
  gstBaseAmount: Number,
  gstAmount: Number,
  grandTotal: Number,
  finalAmount: Number,
  yearlyAmounts: [{
    year: { type: Number, required: true },
    previousYearAmount: Number,
    referredBy: { type: String, default: null, trim: true },
    currentYearAmount: { type: Number, required: true },
    gstRate: { type: Number, enum: [5, 18], required: true },
    mcaSurchargePercent: Number,
    mcaSurchargeAmount: Number,
    amountBeforeGst: Number,
    gstBaseAmount: Number,
    gstAmount: Number,
    grandTotal: Number,
    finalAmount: Number,
  }],
  createdBy: { type: ObjectId, ref: "users" },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes (recommended)**

```javascript
db.actual_plans.createIndex({ startDate: 1 });
db.actual_plans.createIndex({ startDate: 1 });
db.actual_plans.createIndex({ startDate: 1, belongsTo: 1 });
db.actual_plans.createIndex({ districtId: 1, startDate: 1 });
db.actual_plans.createIndex({ departmentId: 1, startDate: 1 });
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

## 6. Frontend behavior notes

### 6.1 Calendar controls and filters

- **View toggle:** `Monthly` \| `Yearly` (segmented control above the calendar).
- **Period picker:** click the month/year title to open a dropdown:
  - **Monthly:** month + year selects, then **Apply**
  - **Yearly:** year select only, then **Apply**
- **Prev / Next:** previous or next month (monthly) or year (yearly).
- Tabs: `All` / `District` / `Department`
- Optional district and department filters are supported together.
- `Today` button behavior:
  - jumps to current month and year
  - resets tab to `all`
  - clears `districtId` and `departmentId` filters
- **Yearly grid:** 12 month tiles; click a month to switch to monthly view for that month. Each tile shows per-type summary lines (see §6.7).

### 6.7 Calendar statistics (by event type)

Below the calendar, the UI shows **four summary cards** (MCA, Tender, Department 4(g), DC (4g)) for the active period:

| View | Period | Aggregation |
|------|--------|-------------|
| Monthly | Selected `YYYY-MM` | Unique events in that month (deduped by `id`) |
| Yearly | Selected `YYYY` | Unique events in that year (deduped by `id` across all months) |

**Each card displays**

- Event type label (with colour from `EVENT_TYPE_STYLES`)
- **Event count** for that type in the period
- **Total final amount** — sum of `finalAmount` (or `grandTotal`) for events with amounts configured for that calendar year

**Yearly month tiles**

Each of the 12 month boxes shows compact lines for types with at least one event:

`{Type label} — {count} events — ₹ {total final amount}`

Amounts use **effective** values for the viewed calendar year (`yearlyAmounts` slice when `recurrenceType === YEARLY`). Events without a slice for that year count toward event count but show **“Amounts not set”** in the amount line when all amounts for that type are unset.

**Optional API response (recommended for backend)**

`GET /actual-plans` may include a `stats` object so the client does not recompute:

```json
{
  "success": true,
  "data": {
    "events": [ ],
    "stats": {
      "period": "2026-05",
      "byEventType": [
        {
          "eventType": "MCA",
          "count": 3,
          "totalFinalAmount": 95000000,
          "unsetAmountCount": 0
        },
        {
          "eventType": "TENDER",
          "count": 1,
          "totalFinalAmount": 12000000,
          "unsetAmountCount": 0
        },
        {
          "eventType": "DEPARTMENT_4G",
          "count": 0,
          "totalFinalAmount": 0,
          "unsetAmountCount": 0
        },
        {
          "eventType": "DC_4G",
          "count": 2,
          "totalFinalAmount": 45000000,
          "unsetAmountCount": 1
        }
      ]
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `stats.period` | `YYYY-MM` when `month` query sent; `YYYY` when `year` query sent |
| `byEventType` | One row per `eventType`; include all four types even when `count` is 0 |
| `count` | Number of distinct events of that type in the period |
| `totalFinalAmount` | Sum of effective `finalAmount` (integer rupees); exclude events with no amount slice |
| `unsetAmountCount` | Events of that type in period with no configured amounts for the calendar year |

If `stats` is omitted, the frontend computes the same shape from the event list using `aggregateEventTypeStats()` in `src/utils/businessPlanEvent.js`.

### 6.2 Calendar day card content

Each day pill should show:

1. Event name
2. Location summary:
   - district name, or
   - department name, or
   - `District · Department` when `belongsTo === "both"`
3. Final amount in rupees with Indian grouping (no decimals)

### 6.3 List drawer expectations

- Opens from **List** button on the Actual Plan page.
- Uses wide drawer layout (`size="wide"`).
- Supports search and date range.
- Uses same event payload contract as calendar/list endpoints.
- Table should include district, department, venue, type, amounts, GST, final total.
- Long district/department/venue values should wrap cleanly.

### 6.4 Amount input and display conventions

- Store amounts as integer rupees (no paise).
- Display amounts with Indian formatting (example: `₹ 3,71,70,000`).
- Wizard amount fields:
  - `previousYearAmount` (required)
  - `referredBy` (optional)
  - `currentYearAmount` (required)
  - `gstRate` (required: `5` or `18`)
- `previousYearAmount` is reference-only and does not affect final calculation.

### 6.5 Venue behavior

- Venues are global and not scoped by district/department.
- Wizard can create venue inline (`POST /venues`) and refresh dropdown using `GET /venues`.
- Full venue API contract is defined in section `3`.
- Wizard step order is already documented in section `1.5`.

---

## 7. Frontend file reference

| Purpose | Path |
|---------|------|
| API client | `src/api/actualplan.js` |
| Calendar page | `src/dashboard/owner/actualplan/ActualPlanCalendar.jsx` |
| Event wizard (modal, 8 steps) | `src/dashboard/owner/actualplan/EventWizard.jsx` |
| Event utils (shared with Business Plan) | `src/utils/businessPlanEvent.js` |
| Constants (shared with Business Plan) | `src/constants/businessPlan.js` |
| Calendar month / pills | `src/dashboard/owner/actualplan/CalendarMonth.jsx` |
| Calendar year grid | `src/dashboard/owner/actualplan/CalendarYear.jsx` |
| Calendar type statistics | `src/dashboard/owner/actualplan/ActualPlanTypeStats.jsx` |
| Month/year picker | `src/dashboard/owner/actualplan/CalendarPeriodPicker.jsx` |
| Calendar date helpers | `src/utils/calendar.js` |
| List drawer | `src/dashboard/owner/actualplan/ActualPlanListDrawer.jsx` |
| Add venue modal | `src/dashboard/owner/actualplan/AddVenueModal.jsx` |
| Amount helpers (shared with Business Plan) | `src/utils/businessPlanAmounts.js` |
| Indian currency helpers | `src/utils/indianCurrency.js` |
| Venues API | `src/api/venue.js` |
| Venues admin | `src/dashboard/admin/venue/ViewVenues.jsx` |
| Nav (Actual Plan is first owner item) | `src/config/navigation.js` |

---

## 8. Changelog

| Date | Notes |
|------|-------|
| 2026-08-04 | Actual Plan cloned as first owner menu; separate `/actual-plans` API + `actual_plans` collection; same feature set as Business Plan |
| 2026-05-15 | Initial schema for Actual Plan calendar MVP |
| 2026-05-22 | Both belongsTo, venues, amounts for all event types (MCA +5% then GST) |
| 2026-05-22 | `DEPARTMENT_4G` / `DC_4G`, `referredBy`, integer Indian amounts |
| 2026-05-28 | 8-step wizard; `recurrenceType` / `isRecurring` / `recurrenceEndDate`; yearly calendar projection |
| 2026-05-28 | Monthly/yearly calendar toggle; `GET /actual-plans?year=YYYY`; period picker (month+year or year only) |
| 2026-05-28 | `yearlyAmounts[]` per-calendar-year pricing for `YEARLY` events; effective amounts on list by query year |
| 2026-05-28 | Calendar statistics by event type (monthly cards + yearly month tiles); optional `stats.byEventType` on list API |
