# Client Finance & Budget Report — Backend Schema

## Purpose

The Wed-Leads module (Leads-Tracker and Bookings tabs) reads client/booking data from the **external** Wed-Leads database (a different project's DB, reached only via the app's `wedLeadsClient`). This document specifies **two new collections that must live in this project's own backend/database** (the same backend the app calls via `apiClient` for districts/departments/venues/users/business-plan/etc.), so that financial tracking data (Agreed Amount, GST/cash split, advances, and an editable "Budget Report" spreadsheet) is never written to the external Wed-Leads DB — only a reference to it is kept.

Both new resources are **polymorphic**: a record can belong either to a "lead" (from the external client-leads collection) or a "booking" (from the external client-bookings/events collection), because a lead and a booking for the same real-world client have **no shared/matching ID** between the two external collections — they're different projects. The reference is a `{ sourceType, sourceId }` pair, where `sourceId` is the external Mongo `_id` string. **This backend should NOT attempt to validate or join against the external DB** — treat `sourceId` as an opaque string.

There are three frontend entry points into `budget_reports`: an "Add New / Clone / View / Edit" flow attached to each row of the Leads-Tracker and Bookings tabs (scoped to one `sourceType` at a time), and a standalone **"Budget Reports" page** reachable from the main nav that lists every budget report across both source types with filters (type, search, updated-date range) — see the `GET /budget-reports` endpoint below, which now needs to support an unscoped (all-types) query for that page.

---

## Collection 1: `client_finances`

One record per `(sourceType, sourceId)` — a client/booking can have at most one finance record.

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId / string | auto | primary key |
| `sourceType` | string enum: `"lead"` \| `"booking"` | yes | |
| `sourceId` | string | yes | external `_id` from the Wed-Leads DB (client-leads or client-bookings collection depending on `sourceType`) — opaque, not a local FK |
| `agreedAmount` | integer (rupees, whole number) | yes | total amount agreed with the client |
| `accountAmount` | integer (rupees) | yes, default `0` | portion of the agreed amount to be paid via bank/account (pre-GST base) |
| `accountGst` | integer (rupees) | yes, computed | `round(accountAmount * 0.18)` |
| `accountAmountWithGst` | integer (rupees) | yes, computed | `accountAmount + accountGst` |
| `cashAmount` | integer (rupees) | yes, computed | `max(agreedAmount - accountAmountWithGst, 0)` — clamped at 0, never negative |
| `advances` | array of objects | yes, default `[]` | see **Advance sub-schema** below |
| `createdBy` | string (user id) | yes | from auth context |
| `updatedBy` | string (user id) | yes | from auth context |
| `createdAt` | ISO datetime | yes | |
| `updatedAt` | ISO datetime | yes | |

### Advance sub-schema (`advances[]`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | client-generated id (uuid), stable identity for edit/delete of a specific advance row |
| `amount` | integer (rupees) | yes | |
| `date` | string `YYYY-MM-DD` | yes | |
| `status` | string enum: `"Pending"` \| `"Received"` | yes, default `"Pending"` | |

Deliberately minimal — no advance number, payer name, collector name, payment mode, or remarks fields. Keep it to exactly these four.

### Computed field NOT stored: `balance`

`balance = agreedAmount − Σ(advances[i].amount where advances[i].status === "Received")`

**Compute this server-side on every read** (both the single-record GET and the bulk-lookup endpoint), do not persist it as a column. This avoids a whole class of "forgot to recompute after an advance flips from Pending to Received" bugs. Pending advances do NOT reduce the balance.

### Validation rules
- `accountAmount`, `agreedAmount` ≥ 0.
- Re-derive `accountGst`/`accountAmountWithGst`/`cashAmount` server-side from `agreedAmount`/`accountAmount` on every write — **do not trust the client's computed values verbatim** (this is money data; the frontend sends these fields for convenience/display but the backend is the source of truth).
- If `accountAmountWithGst > agreedAmount`, still allow the save (the frontend shows a non-blocking warning) — do not hard-reject.

### Indexes
- **Unique compound index** on `(sourceType, sourceId)` — enforces the "one finance record per source" rule and serves both the single-record lookup and the bulk-lookup query (`sourceType` equality + `sourceId $in [...]`).
- If the datastore is not MongoDB (confirm with the platform team — `API_BASE_URL` is an AWS API Gateway URL, the underlying store isn't visible from the frontend), the equivalent is a composite partition/sort key or a unique constraint on the same two columns, e.g. a DynamoDB partition key of `sourceType#sourceId`.

---

## Collection 2: `budget_reports`

One record per `(sourceType, sourceId)` — a client/booking can have at most one Budget Report. Holds an editable spreadsheet (Univer Sheets workbook snapshot).

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId / string | auto | primary key |
| `sourceType` | string enum: `"lead"` \| `"booking"` | yes | |
| `sourceId` | string | yes | external `_id`, opaque |
| `sourceLabel` | string | yes | denormalized display text (e.g. client name / event name) supplied by the frontend at create/clone time — the frontend already has this loaded from the external API, so this avoids the backend ever needing to call the external Wed-Leads API just to render a search/clone picker. Refreshed on every save. |
| `snapshot` | object (arbitrary JSON) | yes | the Univer workbook snapshot (`IWorkbookData` — Univer's own JSON format for a full spreadsheet: sheets, cells, styles, etc.). Treat as an opaque blob — do not attempt to parse or validate its internal shape. |
| `snapshotVersion` | integer | yes, default `1` | incremented by 1 on every successful save. A cheap signal for future optimistic-concurrency checks — not enforced yet (last-write-wins is acceptable for the current MVP). |
| `clonedFrom` | object \| `null` | no | `{ budgetReportId, sourceType, sourceId, clonedAt }`. Set **once**, only at creation via the Clone flow (see `POST /budget-reports/clone` below). Never mutated after creation. `null` for a record created via plain "Add New". |
| `createdBy`, `updatedBy` | string (user id) | yes | |
| `createdAt`, `updatedAt` | ISO datetime | yes | |

### Validation rules
- `snapshot` must be valid JSON (structural validation of Univer's internal schema is the frontend's responsibility, not the backend's).
- **`snapshot` must never be included in the bulk-lookup response** (see endpoint below) — it can be large, and the bulk-lookup is called just to render "Add New / Clone" vs "View" per table row, which only needs existence + a timestamp.

### Indexes
- **Unique compound index** on `(sourceType, sourceId)`.
- Secondary index on `(sourceType, sourceLabel)` (or a text index on `sourceLabel`) to back the search/list query — this now needs to perform well **without** a `sourceType` filter too (the "Budget Reports" listing page searches across all types by default), so don't make the index's leading field `sourceType` alone assuming every query filters on it.
- An index on `updatedAt` (or a compound `(updatedAt, sourceType)`) to serve the listing page's default sort and its `updatedFrom`/`updatedTo` range filter efficiently.

---

## Endpoints

All under the existing own-backend base path (same host/auth as districts/departments/venues/etc. — Bearer token via the existing auth middleware). Response envelope matches the existing convention used by every other own-backend endpoint: `{ "success": true, "data": ... }` (and `{ "success": false, "error": "..." }` on failure).

### `client-finances`

**`GET /client-finances/by-source?sourceType=lead&sourceId=<id>`**
Returns the single record (with computed `balance`), or `404` if none exists yet (frontend treats 404 as "no record — show Add").

```json
{
  "success": true,
  "data": {
    "id": "cf_1",
    "sourceType": "lead",
    "sourceId": "665a1f...e91",
    "agreedAmount": 950000,
    "accountAmount": 800000,
    "accountGst": 144000,
    "accountAmountWithGst": 944000,
    "cashAmount": 6000,
    "advances": [
      { "id": "adv_1", "amount": 200000, "date": "2026-06-01", "status": "Received" },
      { "id": "adv_2", "amount": 100000, "date": "2026-07-15", "status": "Pending" }
    ],
    "balance": 750000,
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-08-20T09:12:00.000Z"
  }
}
```

**`POST /client-finances`** — create. Body: same shape as above minus `id`/`balance`/timestamps (`sourceType`, `sourceId`, `agreedAmount`, `accountAmount`, `advances`). Fails with a conflict (409) if a record for that `(sourceType, sourceId)` already exists — use `PUT` to update instead.

**`PUT /client-finances/:id`** — update. Body: `{ agreedAmount, accountAmount, advances }`. Recomputes `accountGst`/`accountAmountWithGst`/`cashAmount` server-side; returns the full updated record (with `balance`).

**`POST /client-finances/bulk-lookup`** — used by both table views to avoid one request per row.

```json
// Request
{ "sourceType": "lead", "sourceIds": ["id1", "id2", "id3"] }

// Response — keyed by sourceId; a sourceId with no record is simply absent from the map
{
  "success": true,
  "data": {
    "id1": { "id": "cf_1", "agreedAmount": 950000, "balance": 750000, "accountAmountWithGst": 944000, "cashAmount": 6000 },
    "id3": { "id": "cf_9", "agreedAmount": 500000, "balance": 500000, "accountAmountWithGst": 0, "cashAmount": 500000 }
  }
}
```

---

### `budget-reports`

**`GET /budget-reports/by-source?sourceType=booking&sourceId=<id>`** — single record including `snapshot`. `404` if none exists.

**`POST /budget-reports`** — create blank ("Add New"). Body: `{ sourceType, sourceId, sourceLabel, snapshot }` (frontend sends a default empty-workbook snapshot). `409` if one already exists for that source.

**`POST /budget-reports/clone`** — clone-and-create in one atomic server-side operation (so the potentially large snapshot never has to round-trip through the client).

```json
// Request
{
  "fromBudgetReportId": "br_5",
  "sourceType": "booking",
  "sourceId": "6a7c...12",
  "sourceLabel": "Poorna & Varun — Wedding"
}
// Response: the full new budget_reports record, with `clonedFrom` populated from the source record's id/sourceType/sourceId and the current timestamp.
```

**`PUT /budget-reports/:id`** — save edits. Body: `{ snapshot, sourceLabel? }`. Increments `snapshotVersion` by 1 on every call.

**`GET /budget-reports?sourceType=&search=&updatedFrom=&updatedTo=&page=&limit=`** — backs two frontend features: the "Clone from another row" picker (scoped to one `sourceType`), and a standalone **"Budget Reports" listing page** that shows every budget report across both source types with filters. All query params are optional:
- `sourceType` — `"lead"` or `"booking"`. **Omit it to search across every source type** (this is new: the field used to be effectively required for the clone picker's use case, but the listing page needs "all types" as the default).
- `search` — case-insensitive substring match against `sourceLabel`.
- `updatedFrom` / `updatedTo` — `YYYY-MM-DD`, inclusive date-range filter on `updatedAt` (whole-day granularity — `updatedTo` should include records up to the end of that day).
- `page` / `limit` — 1-indexed pagination, default `page=1`, `limit=20`.

Returns lightweight entries **without** `snapshot`, sorted by `updatedAt` descending. Each item now includes `sourceType` (new — needed by the listing page to render a Lead/Booking tag per row and to build the correct edit link, since a single result set can now mix both types):

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "br_5", "sourceType": "booking", "sourceId": "6a7c...12", "sourceLabel": "Poorna & Varun — Wedding", "updatedAt": "2026-08-20T09:00:00.000Z" }
    ],
    "total": 1
  }
}
```

**`POST /budget-reports/bulk-lookup`** — same request shape as the client-finances one; response is deliberately **snapshot-free**:

```json
{ "success": true, "data": { "id1": { "id": "br_5", "updatedAt": "2026-08-20T09:00:00.000Z" } } }
```

---

## Priority / rollout

**Must-have for MVP** (9 endpoints): both `by-source` GETs, both `bulk-lookup` POSTs, `client-finances` POST + PUT, `budget-reports` POST (blank) + `clone` + PUT, and the `budget-reports` search GET.

**Nice-to-have, can follow later**: `DELETE` on either collection (admin correction path only — not exposed in the initial UI).

## Explicitly out of scope for this backend work

- No changes to the external Wed-Leads database or its API — this is entirely new, separate storage.
- No FK/referential-integrity checks against `sourceId` — it points at a different service's database that this backend cannot and should not query.
- No need to store or compute anything about the client's name/contact beyond the `sourceLabel` string the frontend provides — full client details live in the external Wed-Leads DB.
