# Calendar Todos API — Backend Schema Specification

This document describes the REST API and MongoDB schema for the Dhruva Government frontend **owner Calendar** (`/owner/calendar`).

> **Separate from Actual Plan / Business Plan:** Calendar todos are personal, timed reminders. They are **not** plan events. Do **not** share rows with `actual_plans` or `business_plans`.
>
> - Frontend route: `/owner/calendar` (**first owner menu item**; default landing for `owner`)
> - API resource: `/todos`
> - Collection: `todos`

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

## 1. Access control

| Rule | Detail |
|------|--------|
| Allowed roles | `owner` only (403 for `admin` and others) |
| Ownership | Every todo is scoped to the authenticated user (`userId` from JWT) |
| List / get / update / delete | Return or mutate **only** todos where `userId === req.user.id` |
| Never trust client `userId` | Ignore `userId` if sent in the body; always set from the token |

---

## 2. Todo entity

### 2.1 Stored fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (ObjectId) | yes (response) | Unique todo ID. Map `_id` → `id` in JSON. |
| `userId` | string (ObjectId) | yes | Owner of the todo. Set from JWT. Never returned as optional. |
| `title` | string | yes | Display title on the calendar (max 200) |
| `date` | string (ISO date) | yes | Calendar day `YYYY-MM-DD` (local civil date, not UTC instant) |
| `allDay` | boolean | yes | `true` = no clock time (Google Calendar all-day). Default `false`. |
| `startTime` | string \| null | conditional | `HH:mm` 24-hour (`00:00`–`23:45` in 15-minute steps). **Required when `allDay` is false.** `null` when all-day. |
| `endTime` | string \| null | conditional | `HH:mm` 24-hour. **Required when `allDay` is false.** Must be **strictly after** `startTime` (same day). `null` when all-day. |
| `notes` | string \| null | no | Optional description (max 2000). Store `null` when empty. |
| `color` | enum | yes | Calendar chip colour. Default `"blue"`. |
| `completed` | boolean | yes | Todo done state. Default `false`. Completed items still appear on the calendar (struck through). |
| `createdAt` | datetime | yes | Audit |
| `updatedAt` | datetime | yes | Audit |

### 2.2 Colour enum

Frontend chips (`src/constants/todo.js`):

| Value | UI |
|-------|----|
| `blue` | Blue (default) |
| `green` | Green |
| `red` | Red |
| `amber` | Amber |
| `purple` | Purple |
| `teal` | Teal |
| `pink` | Pink |

Reject any other value with `400`.

### 2.3 Validation rules

1. `title` — trim; non-empty; max 200 characters.
2. `date` — valid `YYYY-MM-DD` (calendar date; do not convert via UTC midnight in a way that shifts the day).
3. `allDay` — boolean; default `false`.
4. If `allDay === true`:
   - persist `startTime: null`, `endTime: null` (ignore any times in the body).
5. If `allDay === false`:
   - `startTime` and `endTime` required
   - both must match `^([01]\d|2[0-3]):([0-5]\d)$`
   - frontend sends 15-minute steps; backend may accept any valid `HH:mm`
   - `endTime` must be **greater than** `startTime` (same-day only; no overnight span in v1)
6. `notes` — optional; trim; empty → `null`; max 2000 characters.
7. `color` — one of the enum values; default `"blue"`.
8. `completed` — boolean; default `false`.
9. v1 is **single-day**. Do not accept `endDate` / multi-day range yet.

### 2.4 Example document (API JSON)

```json
{
  "id": "68ae1b2c3d4e5f6789012345",
  "userId": "6a06f9b708da0e4c320f3de0",
  "title": "Call district collector",
  "date": "2026-08-27",
  "allDay": false,
  "startTime": "09:00",
  "endTime": "10:00",
  "notes": "Confirm venue for MCA review.",
  "color": "blue",
  "completed": false,
  "createdAt": "2026-08-27T10:00:00.000Z",
  "updatedAt": "2026-08-27T10:00:00.000Z"
}
```

All-day example:

```json
{
  "id": "68ae1b2c3d4e5f6789012346",
  "userId": "6a06f9b708da0e4c320f3de0",
  "title": "Submit monthly report",
  "date": "2026-08-29",
  "allDay": true,
  "startTime": null,
  "endTime": null,
  "notes": null,
  "color": "amber",
  "completed": false,
  "createdAt": "2026-08-27T10:05:00.000Z",
  "updatedAt": "2026-08-27T10:05:00.000Z"
}
```

---

## 3. MongoDB schema

**Collection:** `todos`

```js
{
  _id: ObjectId,
  userId: ObjectId,          // ref: users
  title: String,
  date: String,              // "YYYY-MM-DD"
  allDay: Boolean,
  startTime: String | null,  // "HH:mm"
  endTime: String | null,    // "HH:mm"
  notes: String | null,
  color: String,             // enum
  completed: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.1 Mongoose example

```js
const TODO_COLORS = ["blue", "green", "red", "amber", "purple", "teal", "pink"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const todoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    date: { type: String, required: true, match: DATE_RE },
    allDay: { type: Boolean, default: false },
    startTime: { type: String, default: null, match: TIME_RE },
    endTime: { type: String, default: null, match: TIME_RE },
    notes: { type: String, default: null, trim: true, maxlength: 2000 },
    color: { type: String, enum: TODO_COLORS, default: "blue" },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

todoSchema.pre("validate", function syncTimes() {
  if (this.allDay) {
    this.startTime = null;
    this.endTime = null;
    return;
  }
  if (!this.startTime || !this.endTime) {
    this.invalidate("startTime", "startTime and endTime are required when allDay is false");
    return;
  }
  if (this.endTime <= this.startTime) {
    this.invalidate("endTime", "endTime must be after startTime");
  }
});
```

Always serialize `_id` as `id` in responses (same convention as other resources).

### 3.2 Indexes

```js
{ userId: 1, date: 1 }
{ userId: 1, date: 1, startTime: 1 }
```

Optional unique is **not** required — a user may have many todos on the same day.

### 3.3 Sort order (list)

Match the frontend:

1. `completed` ascending (`false` first)
2. `allDay` descending (`true` first — all-day bars above timed chips)
3. `startTime` ascending (`null` for all-day sorts first)
4. `title` ascending

---

## 4. Endpoints

Resource path: **`/todos`**

### 4.1 List todos (month calendar)

```http
GET /todos
```

Used by the owner month grid. Send **`month`** for the calendar view.

**Query parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `month` | string | conditional | `YYYY-MM` (e.g. `2026-08`). Inclusive: all todos whose `date` falls in that calendar month. |
| `date` | string | conditional | `YYYY-MM-DD`. Single-day list (optional; unused by month grid, useful for a day panel). |
| `completed` | boolean | no | If set, filter by `completed`. Omit to return both. |

Send **either** `month` **or** `date`, not both. If neither is sent, default to the **current calendar month**.

**Month filter**

```
date >= `{year}-{month}-01`
date <= last day of that month
```

Use string compare on `YYYY-MM-DD` (safe because of ISO ordering). Do **not** convert `date` through UTC `Date` in a way that can shift the civil day.

**Examples**

```http
GET /todos?month=2026-08
GET /todos?date=2026-08-27
GET /todos?month=2026-08&completed=false
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "68ae1b2c3d4e5f6789012345",
      "userId": "6a06f9b708da0e4c320f3de0",
      "title": "Call district collector",
      "date": "2026-08-27",
      "allDay": false,
      "startTime": "09:00",
      "endTime": "10:00",
      "notes": "Confirm venue for MCA review.",
      "color": "blue",
      "completed": false,
      "createdAt": "2026-08-27T10:00:00.000Z",
      "updatedAt": "2026-08-27T10:00:00.000Z"
    }
  ]
}
```

Empty month: `{ "success": true, "data": [] }`.

Include adjacent-month days that appear on the UI grid? **No.** Frontend pads the grid with neighbouring dates but only requests `month=YYYY-MM`. Todos on trailing/leading days of other months appear when the user navigates to that month. (If you prefer Google-like padding, you may optionally also return todos for the 6-week grid; the current client does not require it.)

### 4.2 Get one todo

```http
GET /todos/{id}
```

**Response `200`:** `{ "success": true, "data": { …todo } }`  
**Response `404`:** not found **or** belongs to another user (do not leak existence).

### 4.3 Create todo

```http
POST /todos
```

**Request body**

```json
{
  "title": "Call district collector",
  "date": "2026-08-27",
  "allDay": false,
  "startTime": "09:00",
  "endTime": "10:00",
  "notes": "Confirm venue for MCA review.",
  "color": "blue",
  "completed": false
}
```

| Field | Notes |
|-------|--------|
| `title` | required |
| `date` | required `YYYY-MM-DD` |
| `allDay` | optional, default `false` |
| `startTime` / `endTime` | required unless `allDay` |
| `notes` | optional |
| `color` | optional, default `blue` |
| `completed` | optional, default `false` |

**Response `201`** (or `200`): created entity in `data`.

**Response `400`:** validation error, e.g.

```json
{
  "success": false,
  "message": "End time must be after start time."
}
```

Frontend reads `message` or `error` from the JSON body.

### 4.4 Update todo

```http
PUT /todos/{id}
```

Same body shape as create. Treat as **full replace of editable fields** (not patch): send title, date, allDay, times, notes, color, completed.

Do not allow changing `userId`.

**Response `200`:** updated entity.  
**Response `404`:** missing / not owned.  
**Response `400`:** validation.

### 4.5 Delete todo

```http
DELETE /todos/{id}
```

**Response `200` or `204`:** success.  
**Response `404`:** missing / not owned.

---

## 5. Error catalogue

| Status | When |
|--------|------|
| `400` | Invalid date/time, empty title, `endTime <= startTime`, unknown `color`, both `month` and `date` sent |
| `401` | Missing / invalid JWT |
| `403` | Authenticated but role is not `owner` |
| `404` | Unknown id or todo owned by another user |
| `500` | Unexpected server error |

---

## 6. Frontend contract

| Piece | Path |
|-------|------|
| Nav (Calendar first) | `src/config/navigation.js` |
| Route | `/owner/calendar` → `src/dashboard/owner/calendar/` |
| API client | `src/api/todo.js` (`GET/POST/PUT/DELETE /todos`) |
| Month query | `GET /todos?month=YYYY-MM` |
| Create body | `{ title, date, allDay, startTime, endTime, notes, color, completed }` |
| Times | 15-minute `HH:mm` selects; all-day sends `startTime: null`, `endTime: null` |
| Default times | Same day as today → next full hour, 1 hour duration; other days → `09:00`–`10:00` |

**Click behaviour (Google Calendar–style month view)**

- Click empty day cell → `POST /todos` modal with that `date` and default times.
- Click a chip → `PUT /todos/{id}` (edit) or `DELETE /todos/{id}`.
- `+N more` → day list, then create/edit as above.

---

## 7. Suggested Express sketch

```js
router.get("/todos", auth, ownerOnly, listTodos);
router.get("/todos/:id", auth, ownerOnly, getTodo);
router.post("/todos", auth, ownerOnly, createTodo);
router.put("/todos/:id", auth, ownerOnly, updateTodo);
router.delete("/todos/:id", auth, ownerOnly, deleteTodo);
```

`listTodos` must always add `{ userId: req.user.id }` to the Mongo filter.

---

## 8. Out of scope (v1)

- Recurrence / reminders / notifications
- Multi-day or overnight todos
- Sharing / assigning to other users
- Attachments
- Time zones other than the user's civil date (store `date` + `HH:mm` as wall-clock, not UTC instants)

---

## 9. Changelog

| Date | Notes |
|------|-------|
| 2026-08-27 | Initial Calendar todos schema: `/todos`, `todos` collection, month view + timed create |
