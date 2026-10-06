# Client Bookings — View-only frontend contract

Paste this into another project’s frontend. It covers the **List View table + filters + stats + event details drawer** (read-only). No add booking, no advance edit, no Excel, no budget-report mutations.

**Source UI in this repo**

| Piece | Path |
|-------|------|
| Page | `src/Dashboard/Accounts/ViewClientsBookings.jsx` |
| Table / tabs / filters | `src/Dashboard/Accounts/clientBookings/ClientBookingsListTab.jsx` |
| Filters | `src/Dashboard/Accounts/clientBookings/ClientBookingsFilters.jsx` |
| Stats cards | `src/Dashboard/Accounts/clientBookings/ClientBookingsStatsCards.jsx` |
| Money helpers | `src/Dashboard/Accounts/clientBookings/clientBookingsUtils.js` |

**API root:** `${API_BASE_URL}`  
Production example: `https://dk5h700gx5.execute-api.ap-south-1.amazonaws.com/api/`

---

## Scope (view-only)

| Include | Exclude |
|---------|---------|
| `GET /events` list + `totalsByStatus` | `PATCH` advances |
| `GET /venue` for venue filter | Create / edit booking |
| Optional `GET /events/:id` for a full single event | Budget report clone / add |
| Status tabs, filters, stats cards | Calendars, Balance Sheet, Leaderboard |
| Event details drawer (read-only) | Excel modules |

The Accounts page also has a **Leads** tab that is the Leads Tracker view-only table (`GET /client-leads`). See `LEADS_TRACKER_VIEW_ONLY_FRONTEND.md`.

---

## Auth

```http
Authorization: <access_token from login>
```

```js
const config = { headers: { Authorization: accessToken } };
```

---

## APIs used by this view

### 1) List bookings (main table)

`GET ${API_BASE_URL}events`

| Query | Type | Required | Notes |
|-------|------|:--------:|-------|
| `page` | number | no | Default `1` when `limit` is set. UI default page size **20**. |
| `limit` | number | no | Clamped `1..500`. UI options: `10`, `20`, `50`. |
| `status` | string | no | Tab mapping below. Alias: `eventConfirmation`. Invalid → `400`. |
| `eventName` | string | no | Event-name ObjectId **or** partial / full name (case-insensitive). UI sends the **display name** collected from previous pages. |
| `startDate` | `YYYY-MM-DD` | no | At least one `eventTypes[]` with `startDate >=` this |
| `endDate` | `YYYY-MM-DD` | no | At least one `eventTypes[]` with `endDate <=` this |
| `venue` / `venueLocation` | ObjectId | no | Sub-match on `eventTypes.venueLocation`. UI sends **both** `venueId` and `venueLocation`. |
| `venueId` | ObjectId | no | Same as venue; sent for backend compatibility |

**Status tab → query**

| Tab key | Query `status` | Matches `eventConfirmation` |
|---------|----------------|-----------------------------|
| `all` | omit | all |
| `confirmed` | `confirmed` | `Confirmed Event` |
| `inprogress` | `inprogress` | `InProgress` |
| `cancelled` | `cancelled` | `Cancelled` |

Changing tab, event name, venue, or date range **resets `page` to 1**.

**Critical:** `events[]` is filtered by `status`. **`totalsByStatus` is not** — it uses the same venue / date / name filters **without** `status`. Tab badges and dashboard cards stay “all statuses for current filters”.

**Example**

```http
GET /events?page=1&limit=20
GET /events?page=1&limit=20&status=confirmed
GET /events?page=1&limit=20&eventName=Wedding&venueLocation=<venueId>&startDate=2026-08-01&endDate=2026-08-31
Authorization: <jwt>
```

**Response (high level)**

```json
{
  "totalEvents": 84,
  "events": [],
  "summary": {
    "summaryScope": "allBookingsMatchingFilter",
    "totalBookings": 84,
    "bookingsInResponse": 20,
    "totalExpectedAdvance": 0,
    "totalReceivedAmount": 0,
    "totalPending": 0,
    "totalAdvanceEntries": 0,
    "totalPayableSum": 0
  },
  "totalsByStatus": {},
  "eventConfirmationFilter": "Confirmed Event",
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

Frontend mapping:

```js
const events = Array.isArray(data.events) ? data.events : [];
const pagination = {
  current: data.page ?? 1,
  pageSize: data.limit ?? 20,
  total: data.totalEvents ?? data.total ?? events.length,
};
// Keep the WHOLE response — totalsByStatus is top-level, not inside summary
const bookingsSummary = data;
```

Pagination fields appear only when `limit` is sent.

---

### 2) Venues (filter dropdown)

`GET ${API_BASE_URL}venue`

Accept any of:

```text
res.data                  // array
res.data.venues
res.data.items
res.data.data
```

Option:

| Field | Value |
|-------|-------|
| `label` | `v.name ?? v.venueName ?? "Unnamed venue"` |
| `value` | `v.id ?? v._id` |

Sort labels alphabetically. Drop options with no `value`.

---

### 3) Optional single booking

`GET ${API_BASE_URL}events/:id`

```text
res.data.event  ??  res.data.data  ??  res.data
```

List rows already include `eventTypes` and advances, so the drawer can open from the table row without this call. Use it if you need a refresh of one booking.

---

## `totalsByStatus` (stats cards + tab badges)

Computed on **baseQuery** (filters except `status`). Money rounded to whole rupees on the server.

### Payable (`_payable`) per booking

| Case | Rule |
|------|------|
| Wedding + `advancePaymentType === "complete"` | `eventTypes[0].totalPayable` only |
| Everything else | Sum `eventTypes[].totalPayable` |

### Received (`_received`) per booking

| Case | Rule |
|------|------|
| Wedding + `advancePaymentType === "complete"` | Dedupe by `advanceNumber` (fallback index) across **all** `eventTypes`. Take **max** `receivedAmount` per key, then sum. Do **not** flat-sum every ceremony. |
| Everything else | Sum `eventTypes[].advances[].receivedAmount` (non-numeric → `0`) |

### `all`

| Field | Meaning |
|-------|---------|
| `totalExpectedAmount` | Sum of payable for all matched bookings |
| `totalBookingsNumber` | Count of all matched bookings |
| `confirmedTotalExpectedAmount` | Payable for `Confirmed Event` only |
| `confirmedTotalBookingsNumber` | Confirmed count |
| `pendingTotalExpectedAmount` | Payable for `InProgress` |
| `pendingTotalBookingsNumber` | In-progress count |

### `confirmed`

| Field | Meaning |
|-------|---------|
| `totalExpectedAmount` | Confirmed payable |
| `totalBookingsNumber` | Confirmed count |
| `totalReceivedAmount` | Confirmed received |
| `bookingsWithAnyReceiptCount` | Confirmed with received > 0 |
| `totalBalanceAmount` | Sum of (payable − received) per confirmed booking |
| `bookingsWithOutstandingBalanceCount` | Confirmed where payable ≠ received |

### `pending` and `inprogress`

Same data (`InProgress` bookings): `totalBookingsNumber`, `totalExpectedAmount`.

### `cancelled`

`Cancelled` bookings: `totalBookingsNumber`, `totalExpectedAmount`.

**Example**

```json
{
  "all": {
    "totalExpectedAmount": 171908236,
    "totalBookingsNumber": 84,
    "confirmedTotalExpectedAmount": 137406436,
    "confirmedTotalBookingsNumber": 68,
    "pendingTotalExpectedAmount": 25540000,
    "pendingTotalBookingsNumber": 7
  },
  "confirmed": {
    "totalExpectedAmount": 137406436,
    "totalBookingsNumber": 68,
    "totalReceivedAmount": 55013910,
    "bookingsWithAnyReceiptCount": 42,
    "totalBalanceAmount": 82392526,
    "bookingsWithOutstandingBalanceCount": 35
  },
  "pending": { "totalBookingsNumber": 7, "totalExpectedAmount": 25540000 },
  "inprogress": { "totalBookingsNumber": 7, "totalExpectedAmount": 25540000 },
  "cancelled": { "totalBookingsNumber": 9, "totalExpectedAmount": 8961800 }
}
```

---

## Booking row fields (list item)

`eventName`, `lead1`, `lead2`, `bookedBy`, `createdBy`, venues may be **populated objects or strings**.

```json
{
  "_id": "6a560dd7145c50b5dbd196e0",
  "eventConfirmation": "Confirmed Event",
  "eventName": { "_id": "695b86a68517cfd3a6730e0c", "name": "Wedding" },
  "advancePaymentType": "complete",
  "clientName": "Poorna Varun",
  "brideName": "Poorna",
  "groomName": "Varun",
  "contactNumber": "9876543210",
  "altContactNumber": "9123456780",
  "meetingDate": "2026-09-12T00:00:00.000Z",
  "note": "",
  "lead1": { "_id": "...", "name": "Archana" },
  "lead2": { "_id": "...", "name": "Ravi" },
  "bookedBy": { "first_name": "archana", "last_name": "K" },
  "createdBy": { "first_name": "admin" },
  "advanceTotals": { "totalReceivedAmount": 50000 },
  "eventTypes": [
    {
      "_id": "et1",
      "eventType": { "name": "Muhurtham" },
      "startDate": "2026-12-01",
      "endDate": "2026-12-01",
      "venueLocation": { "_id": "...", "name": "Taj West End" },
      "subVenueLocation": { "_id": "...", "name": "Lawn" },
      "coordinator": { "name": "Archana" },
      "agreedAmount": 950000,
      "accountAmount": 800000,
      "accountGst": 144000,
      "accountAmountWithGst": 944000,
      "cashAmount": 6000,
      "totalPayable": 950000,
      "advances": [
        {
          "advanceNumber": 1,
          "expectedAmount": 200000,
          "advanceDate": "2026-06-01",
          "receivedAmount": 200000,
          "receivedDate": "2026-06-02",
          "givenBy": "Client",
          "collectedBy": "Archana",
          "modeOfPayment": "UPI",
          "remarks": ""
        }
      ]
    }
  ]
}
```

`eventConfirmation` values: `"Confirmed Event"` | `"InProgress"` | `"Cancelled"` (legacy `"Pending"` may appear).

`advancePaymentType`: `"complete"` | `"separate"` (and similar). Complete **Wedding** uses package rules above.

---

## Table columns (List View)

`rowKey = "_id"`. Server pagination. `scroll.x = 1320`.  
Show total: `Showing {from}-{to} of {total} bookings`.

| Title | Width | Render |
|-------|------:|--------|
| Booked By | 160 | First word of `bookedBy.first_name` (or `firstName`), else `createdBy`. Capitalize first letter. Else `-`. |
| Event Confirmation | 140 | Tag: Confirmed Event = green, InProgress = orange, Cancelled = red, Pending = blue |
| Event Name | 140 | Purple tag. `eventName.name` or string. Else `N/A` |
| Next Meeting Date | 140 | **Only** on In progress / Cancelled tabs. `meetingDate` as `DD MMM YYYY`, or `Not Set` |
| Client Details | 180 | `clientName`. If both `brideName` and `groomName`, show `Bride & Groom` under it |
| Contact | 130 | `contactNumber`. If `altContactNumber` differs, show it too |
| Leads | 120 | `lead1` / `lead2` as string or `.name`. If neither: `No leads` |
| Booked Amount | 130, right | Payable helper (see below), INR |
| Payment Status | 150 | Received, Balance (`max(booked − received, 0)`), `% Collected` = `min(round(received/booked*100), 100)`. Tag: 100% success, >0 warning, else default |
| Event Types | 110, center | **View (N)** button → opens details drawer. `N = eventTypes.length` |

**View-only:** omit the **Budget Report** column (it is mutate/navigate in the original app).

---

## Filters UI (above status tabs)

| Control | Notes |
|---------|-------|
| Event Name | Select, allowClear. Options built from names seen in loaded `events[]` (`getEventName`). Persist unique names across pages. |
| Venue | Select, search. From `GET /venue`. |
| Date Range | RangePicker format `DD-MM-YYYY`. Sends `startDate` / `endDate` as `YYYY-MM-DD`. |
| Clear filters | Clears event name, dates, venue. |

---

## Stats cards by active tab

Prefer `totalsByStatus`. If it is missing, fall back to **this page only** sums of payable / received / (expected advances − received).

### Tab `all`

Amounts: Total expected · Confirmed — total business · In progress — total business (expected)  
Counts: Total bookings · Confirmed bookings · In progress bookings

### Tab `confirmed`

Amounts: Total expected · Total received · Total balance  
Counts: Confirmed bookings · Where payment has started · Where full amount is not yet settled

### Tab `inprogress`

In progress bookings count · Total expected

### Tab `cancelled`

Cancelled bookings count · Total expected

Tab **badges** use `totalBookingsNumber` from the matching `totalsByStatus` bucket (`inprogress` falls back to `pending`).

---

## Event details drawer (read-only)

Open from **View (N)**. Width ~80%. Title = event name.

### Header card (always)

| Label | Field |
|-------|-------|
| Client Name | `clientName` |
| Bride / Groom | if both present |
| Contact | `contactNumber` |
| Alt Contact | `altContactNumber` |
| Project Coordinator 1 / 2 | `lead1` / `lead2` (string or `.name`) |

### If complete-payment Wedding

1. **Complete Package Amount Breakdown** from `eventTypes[0]` only: agreedAmount, accountAmount, accountGst, accountAmountWithGst, cashAmount, totalPayable.
2. Each ceremony card: name, start/end date, venue, sub venue, coordinator. **No per-ceremony amounts.**
3. **Common Advance Payments** table from `eventTypes[0].advances` (same schedule copied on other ceremonies — do not list them again).

### Else (separate / non-wedding)

Each `eventTypes[]` card:

- Start / end date, venue, sub venue, coordinator
- Amount breakdown on that type (same six money fields)
- That type’s `advances[]` table

### Advance table columns (display only)

| Column | Field |
|--------|-------|
| Advance # | `advanceNumber` |
| Expected Amount | `expectedAmount` |
| Expected Date | `advanceDate` → `DD MMM YYYY` |
| Received Amount | `receivedAmount` (green if > 0) |
| Received Date | `receivedDate` |
| Given by | `givenBy` |
| Collected by | `collectedBy` |
| Mode of payment | `modeOfPayment` |
| Remarks | `remarks` |

---

## Copy-paste helpers

```js
export const CLIENT_BOOKINGS_LIST_TAB_API_STATUS = {
  all: undefined,
  confirmed: "confirmed",
  inprogress: "inprogress",
  cancelled: "cancelled",
};

export const getEventsListTotalsBucket = (totalsByStatus, listTabKey) => {
  if (!totalsByStatus || typeof totalsByStatus !== "object") return null;
  if (listTabKey === "all") return totalsByStatus.all ?? null;
  if (listTabKey === "inprogress") {
    return totalsByStatus.inprogress ?? totalsByStatus.pending ?? null;
  }
  return totalsByStatus[listTabKey] ?? null;
};

export const getTabLabelBookingCount = (totalsByStatus, listTabKey) => {
  const b = getEventsListTotalsBucket(totalsByStatus, listTabKey);
  const n = b?.totalBookingsNumber;
  return typeof n === "number" && !Number.isNaN(n) ? n : null;
};

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  return dayjs(dateString).format("DD MMM YYYY");
};

export const formatAmount = (amount) => {
  if (!amount && amount !== 0) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

export const capitalizeFirstLetter = (value) => {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const getEventName = (eventName) => {
  if (typeof eventName === "string") return eventName;
  return eventName?.name || "N/A";
};

export const isCompletePaymentWedding = (record) => {
  const eventNameStr = getEventName(record.eventName);
  return eventNameStr === "Wedding" && record.advancePaymentType === "complete";
};

export const getTotalPayable = (record) => {
  if (isCompletePaymentWedding(record)) {
    return record.eventTypes?.[0]?.totalPayable || 0;
  }
  return record.eventTypes?.reduce((sum, et) => sum + (et.totalPayable || 0), 0) || 0;
};

const getCompleteWeddingAdvanceFieldTotal = (record, field) => {
  const byKey = new Map();
  (record?.eventTypes || []).forEach((et) => {
    (et?.advances || []).forEach((adv, idx) => {
      const key =
        adv?.advanceNumber != null && adv.advanceNumber !== ""
          ? `n:${adv.advanceNumber}`
          : `i:${idx}`;
      const amt = Number(adv?.[field]);
      const value = Number.isFinite(amt) ? amt : 0;
      const prev = byKey.get(key) ?? 0;
      if (value > prev) byKey.set(key, value);
    });
  });
  let total = 0;
  for (const value of byKey.values()) total += value;
  return total;
};

export const getTotalExpectedAdvances = (record) => {
  if (isCompletePaymentWedding(record)) {
    return getCompleteWeddingAdvanceFieldTotal(record, "expectedAmount");
  }
  let total = 0;
  record.eventTypes?.forEach((et) => {
    et.advances?.forEach((adv) => {
      total += adv.expectedAmount || 0;
    });
  });
  return total;
};

export const getTotalReceivedAdvances = (record) => {
  if (isCompletePaymentWedding(record)) {
    return getCompleteWeddingAdvanceFieldTotal(record, "receivedAmount");
  }
  let total = 0;
  record.eventTypes?.forEach((et) => {
    et.advances?.forEach((adv) => {
      total += adv.receivedAmount || 0;
    });
  });
  return total;
};

/** Do not trust advanceTotals.totalReceivedAmount for complete weddings (double-count). */
export const getBookingReceivedAmount = (record) => {
  if (isCompletePaymentWedding(record)) {
    return getTotalReceivedAdvances(record);
  }
  if (record?.advanceTotals?.totalReceivedAmount != null) {
    return Number(record.advanceTotals.totalReceivedAmount) || 0;
  }
  return getTotalReceivedAdvances(record);
};
```

### Fetch list

```js
async function fetchBookingsList({
  page = 1,
  limit = 20,
  listStatusTab = "all",
  eventName,
  venueId,
  startDate, // YYYY-MM-DD
  endDate,
  accessToken,
}) {
  const params = { page, limit };
  const statusParam = CLIENT_BOOKINGS_LIST_TAB_API_STATUS[listStatusTab];
  if (statusParam) params.status = statusParam;
  if (eventName) params.eventName = eventName;
  if (venueId) {
    params.venueId = venueId;
    params.venueLocation = venueId;
  }
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await axios.get(`${API_BASE_URL}events`, {
    headers: { Authorization: accessToken },
    params,
  });
  const data = res.data || {};
  return {
    events: Array.isArray(data.events) ? data.events : [],
    bookingsSummary: data,
    page: data.page ?? page,
    limit: data.limit ?? limit,
    total: data.totalEvents ?? data.total ?? 0,
  };
}

function parseVenues(raw) {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.venues)
      ? raw.venues
      : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.data)
          ? raw.data
          : [];
  return (Array.isArray(list) ? list : [])
    .map((v) => ({
      label: v?.name ?? v?.venueName ?? "Unnamed venue",
      value: v?.id ?? v?._id,
    }))
    .filter((o) => o.value)
    .sort((a, b) => String(a.label).localeCompare(String(b.label)));
}
```

---

## Acceptance checklist (other frontend)

- [ ] `GET /events` with `page` + `limit` and auth header
- [ ] Status tabs send `confirmed` / `inprogress` / `cancelled` or omit for all
- [ ] `totalsByStatus` drives cards and tab counts (not only the current page)
- [ ] Venue filter from `GET /venue`; date range + event name forwarded as query params
- [ ] Booked amount / received / % collected use complete-wedding helpers (no double-count)
- [ ] Meeting date column only on in-progress and cancelled tabs
- [ ] View drawer is read-only: client info, event types, amounts, advances
- [ ] Dates `DD MMM YYYY`; money Indian grouping (`en-IN`)
