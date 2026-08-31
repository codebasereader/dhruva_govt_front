# Leads Tracker — View-only frontend contract

Paste this into another project’s frontend. It covers **list + detail view only** (no add / edit / delete / Excel).

**Source UI in this repo:** `src/Dashboard/Marketting/ClientLeadsTrack/ViewLeads.jsx` (`readOnly` mode)  
**Also used as:** Accounts Client Bookings → Leads tab (`ClientBookingsLeadsTab.jsx` renders `<ViewLeads readOnly embedded />`)

**API root:** `${API_BASE_URL}`  
Production example: `https://dk5h700gx5.execute-api.ap-south-1.amazonaws.com/api/`

---

## Scope (view-only)

| Include | Exclude |
|---------|---------|
| List table | `POST /client-leads` |
| Summary cards | `PUT /client-leads/:id` |
| Filters | `DELETE /client-leads/:id` |
| Lead details drawer | Excel workbook (`/client-leads/excel`) |
| Optional calendar (same list data) | Add / Edit drawers |

---

## Auth

All requests:

```http
Authorization: <access_token from login>
```

Axios example:

```js
const config = { headers: { Authorization: accessToken } };
```

---

## APIs used by this view

### 1) List leads (table + cards)

`GET ${API_BASE_URL}client-leads`

| Query | Type | Required | Notes |
|-------|------|:--------:|-------|
| `status` | string | no | Exact enum: `Inprogress` \| `Confirmed` \| `Cancelled` |
| `assignedTo` | string | no | Coordinator `_id` |
| `startDate` | `YYYY-MM-DD` | no | Inclusive lower bound on lead **`startDate`** |
| `endDate` | `YYYY-MM-DD` | no | Inclusive upper bound on lead **`startDate`** |
| `month` | `YYYY-MM` | no | Shorthand for that month. Send **only if** user picked a month picker (not a custom range). If both `month` and `startDate`/`endDate` exist, backend should prefer the explicit range. |

**Frontend filter → query mapping**

| UI control | Query sent |
|------------|------------|
| Status select | `status` |
| Coordinator select | `assignedTo` |
| Month picker | `startDate` = first day of month, `endDate` = last day of month, `month` = `YYYY-MM` |
| Start date range picker | `startDate` + `endDate` only (clear `month`) |
| Month and range are mutually exclusive | Clearing one when the other is set |

**Examples**

```http
GET /client-leads
GET /client-leads?status=Inprogress
GET /client-leads?assignedTo=696f832492c5abff543b25bc
GET /client-leads?month=2026-08
GET /client-leads?startDate=2026-08-01&endDate=2026-08-31
Authorization: <jwt>
```

**Response** — accept any of these list locations:

```text
res.data.data   ??   res.data.leads   ??   res.data
```

If the chosen value is not an array, treat as `[]`.

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "status": "Inprogress",
      "clientDetails": "Client name: ABC Corp. Contact: John, +91 9876543210.",
      "eventTypeDetails": "Event type: Conference. Venue preference: Bangalore.",
      "notes": "Follow-up call scheduled for 22nd March.",
      "startDate": "2026-08-15",
      "endDate": "2026-08-17",
      "estimatedBudget": 500000,
      "convertedByMarketing": false,
      "convertedAt": null,
      "assignedTo": {
        "_id": "696f832492c5abff543b25bc",
        "name": "Archana",
        "first_name": "Archana",
        "last_name": "K",
        "email": "archana@example.com"
      },
      "createdAt": "2026-03-10T08:00:00.000Z",
      "updatedAt": "2026-03-12T10:30:00.000Z"
    }
  ],
  "summary": {
    "totalEstimatedBudget": 1200000,
    "totalConvertedBudget": 800000,
    "estimatedLeadsCount": 3,
    "convertedLeadsCount": 2
  }
}
```

`summary` is optional. If missing, compute cards on the client from the list (see helpers below). `summary` **must** use the same filters as `data`.

---

### 2) Lead detail (View drawer)

`GET ${API_BASE_URL}client-leads/:id`

```text
res.data.data   ??   res.data
```

Same field shape as a list item. Use this when the user clicks **View**.

---

### 3) Coordinators (filter dropdown)

`GET ${API_BASE_URL}coordinators`

Accept any of:

```text
res.data
res.data.coordinators
res.data.items
res.data.data
```

If not an array, use `[]`.

Select option:

| Field | Value |
|-------|-------|
| `value` | `c._id ?? c.id` |
| `label` | person display name (see helper) |

---

## Lead row fields

| Field | Type | Table | Detail drawer |
|-------|------|:-----:|:-------------:|
| `_id` / `id` | string | rowKey | fetch key |
| `status` | `"Inprogress"` \| `"Confirmed"` \| `"Cancelled"` | yes | yes |
| `convertedByMarketing` | boolean | tag **Converted** under status | tag **Converted by Marketing** |
| `convertedAt` | ISO datetime \| null | no | audit only, not shown |
| `estimatedBudget` | number ≥ 0 | yes, INR | yes, INR |
| `clientDetails` | string | yes, ellipsis | yes, full, `pre-wrap` |
| `eventTypeDetails` | string | yes, ellipsis | yes, full, `pre-wrap` |
| `startDate` | `YYYY-MM-DD` or ISO | `DD MMM YYYY` | `DD MMM YYYY` |
| `endDate` | `YYYY-MM-DD` or ISO | `DD MMM YYYY` | `DD MMM YYYY` |
| `assignedTo` | object \| string \| null | display name | display name |
| `notes` | string | first 100 chars + `...` | full, `pre-wrap` |

Empty display: `"—"`.

---

## Table columns (list view)

Client-side pagination: `pageSize: 10`, `showSizeChanger: true`, `showTotal: (t) => \`${t} leads\``.  
`scroll.x = 1400`. `rowKey = r._id ?? r.id`.

| # | Title | Width | Source / render |
|---|-------|------:|-----------------|
| 1 | Sl no | 70, center | `index + 1` (current page) |
| 2 | Status | 120 | `status`. If `convertedByMarketing` → green **Converted** tag below |
| 3 | Estimated budget | 140, right | `₹` + `toLocaleString("en-IN")` |
| 4 | Client details | flex, ellipsis | `clientDetails` or `—` |
| 5 | Event type details | flex, ellipsis | `eventTypeDetails` or `—` |
| 6 | Start date | 120 | `DD MMM YYYY` |
| 7 | End date | 120 | `DD MMM YYYY` |
| 8 | Assign to | 140 | `getPersonDisplayName(assignedTo)` |
| 9 | Notes | 220 | truncated notes |
| 10 | Action | 90 | **View** only |

---

## Summary cards (above filters)

Two cards. Amounts are **INR**. Counts shown as suffix `· N leads`.

| Card | Amount field | Count field | Rule |
|------|--------------|-------------|------|
| **Estimated Budget (pipeline)** | `totalEstimatedBudget` | `estimatedLeadsCount` | `convertedByMarketing !== true` |
| **Successfully Converted Leads** | `totalConvertedBudget` | `convertedLeadsCount` | `convertedByMarketing === true` |

**Important:** conversion is independent of `status`. `status: Confirmed` does **not** move money to the converted card.

Date filters apply to lead **`startDate`**. When a month/range is active, leads **without** `startDate` are excluded from **both** card totals (they may still appear in an unfiltered list).

Prefer server `summary` when `totalEstimatedBudget` or `totalConvertedBudget` is present. Otherwise fall back to client math on the current `data` array.

---

## Filters UI

| Control | Component | Clearable |
|---------|-----------|:---------:|
| Status | Select, options below | yes |
| Coordinator | Select, search, from `GET /coordinators` | yes |
| Month (by start date) | DatePicker `picker="month"` | yes |
| Start date range | RangePicker, format `DD MMM YYYY` | yes |
| Clear filters | Button, disabled when no filter | — |

**Status options**

```js
const STATUS_OPTIONS = [
  { value: "Inprogress", label: "Inprogress" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Cancelled", label: "Cancelled" },
];
```

---

## Optional calendar tab

Same `leads` array. No extra API.

Place events by `startDate` / `endDate`. Status colors:

| Status | Background | Border | Text |
|--------|------------|--------|------|
| Cancelled | `#fecaca` | `#ef4444` | `#991b1b` |
| Confirmed | `#bbf7d0` | `#22c55e` | `#166534` |
| Inprogress | `#fef9c3` | `#eab308` | `#854d0e` |

---

## Copy-paste helpers

```js
function getPersonDisplayName(person) {
  if (!person) return "";
  if (typeof person === "string") return person;
  const full = [person.first_name ?? person.firstName, person.last_name ?? person.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return person.name || full || person.email || String(person._id ?? person.id ?? "");
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "—";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("DD MMM YYYY") : "—";
}

function formatAmountINR(value) {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

function getNotesDisplay(notes) {
  if (!notes) return "—";
  return notes.length > 100 ? `${notes.substring(0, 100)}...` : notes;
}

function parseList(resData) {
  const list = resData?.data ?? resData?.leads ?? resData;
  return Array.isArray(list) ? list : [];
}

function parseCoordinators(resData) {
  const raw = resData;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.coordinators)
      ? raw.coordinators
      : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.data)
          ? raw.data
          : [];
  return Array.isArray(list) ? list : [];
}

/** Client fallback when API summary is missing. */
function computeBudgetSummaryFromLeads(leads, rangeStart, rangeEnd) {
  let totalEstimatedBudget = 0;
  let totalConvertedBudget = 0;
  let estimatedLeadsCount = 0;
  let convertedLeadsCount = 0;
  const hasRange = Boolean(rangeStart && rangeEnd);

  for (const lead of leads || []) {
    const budget = Number(lead?.estimatedBudget) || 0;
    const start = lead?.startDate ? dayjs(lead.startDate) : null;
    if (hasRange) {
      if (!start || !start.isValid()) continue;
      const ymd = start.format("YYYY-MM-DD");
      if (ymd < rangeStart || ymd > rangeEnd) continue;
    }
    if (lead?.convertedByMarketing) {
      totalConvertedBudget += budget;
      convertedLeadsCount += 1;
    } else {
      totalEstimatedBudget += budget;
      estimatedLeadsCount += 1;
    }
  }

  return {
    totalEstimatedBudget,
    totalConvertedBudget,
    estimatedLeadsCount,
    convertedLeadsCount,
  };
}
```

### Fetch list

```js
async function fetchLeads({ status, assignedTo, startDate, endDate, month, accessToken }) {
  const params = {};
  if (status) params.status = status;
  if (assignedTo) params.assignedTo = assignedTo;
  if (startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
    if (month) params.month = month; // only when month picker was used
  }
  const res = await axios.get(`${API_BASE_URL}client-leads`, {
    headers: { Authorization: accessToken },
    params,
  });
  return {
    leads: parseList(res.data),
    summary: res.data?.summary && typeof res.data.summary === "object" ? res.data.summary : null,
  };
}
```

---

## Acceptance checklist (other frontend)

- [ ] List loads from `GET /client-leads` with auth header
- [ ] Status / coordinator / month / range filters map to the query table above
- [ ] Table shows the 10 columns listed (View action only)
- [ ] Pipeline vs Converted cards do not double-count
- [ ] View drawer loads `GET /client-leads/:id` and shows full notes / details
- [ ] Coordinator filter options come from `GET /coordinators`
- [ ] Dates display as `DD MMM YYYY`; money as Indian grouping (`en-IN`)
