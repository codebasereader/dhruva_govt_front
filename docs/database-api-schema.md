# Database API — Backend Schema Specification

REST contract for the **Database** contact list (`/admin/database`), used by both **admin** and **owner** navigation.

**Base URL:** `{API_BASE_URL}` (e.g. `https://…/api/`)  
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

## 1. Category entity

Categories are managed inline from the entry form (searchable dropdown with add / edit / delete).

### 1.1 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes (response) | Unique category ID |
| `name` | string | yes | Display name (unique recommended) |

### 1.2 Endpoints

#### List categories

```http
GET /database/categories
```

**Query parameters**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Optional case-insensitive name search |

**Response `200`:** array of categories in `data`.

#### Create category

```http
POST /database/categories
```

**Request body**

```json
{
  "name": "VIP Clients"
}
```

**Response `201`:** created category in `data`.

#### Update category

```http
PUT /database/categories/{id}
```

**Request body:** `{ "name": "Updated name" }`

**Response `200`:** updated category in `data`.

#### Delete category

```http
DELETE /database/categories/{id}
```

**Response `200`:** success envelope (or `204`).

---

## 2. Entry entity

### 2.1 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes (response) | Unique entry ID |
| `categoryId` | string | yes | Reference to `database/categories` |
| `categoryName` | string | optional (response) | Populated category name for tables |
| `prefix` | enum | yes | `MR` \| `MRS` \| `MISS` \| `MASTER` |
| `name` | string | yes | Name after prefix (e.g. `Ramesh Kumar`) |
| `contactNumber1` | string | yes | Primary phone |
| `contactNumber2` | string \| null | no | Secondary phone |
| `email` | string \| null | no | Email address |
| `address` | string \| null | no | Postal / full address |
| `companyName` | string \| null | no | Company or organization name |
| `departmentName` | string \| null | no | Department name |
| `designation` | string \| null | no | Designation / role title |
| `referredBy` | string \| null | no | Referrer name or reference |
| `createdAt` | datetime | optional | Audit |
| `updatedAt` | datetime | optional | Audit |

**UI display name:** `{prefix label} {name}` — e.g. `Mr. Ramesh Kumar`.

**UI form layout:** On add/edit, prefix (Mr. / Mrs. / Miss / Master) is a compact dropdown **to the left of** the name field under a single **Name** label (no separate “Prefix” heading). Entry drawer width is **60%** of the viewport.

### 2.2 Prefix enum

| Value | UI label |
|-------|----------|
| `MR` | Mr. |
| `MRS` | Mrs. |
| `MISS` | Miss |
| `MASTER` | Master |

### 2.3 Endpoints

#### List entries

```http
GET /database
```

Used by the **View all** table. The UI sends optional filters as query parameters (debounced search + category dropdown).

**Query parameters**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Optional case-insensitive search across name, company/department/designation, email, phone numbers, address, referred by |
| `categoryId` | string | Optional filter — only entries in this category |

**Example**

```http
GET /database?search=ramesh&categoryId=674a00000000000000000001
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "674a1b2c3d4e5f6789012345",
      "categoryId": "674a00000000000000000001",
      "categoryName": "VIP Clients",
      "prefix": "MR",
      "name": "Ramesh Kumar",
      "contactNumber1": "9876543210",
      "contactNumber2": "9123456780",
      "email": "ramesh@example.com",
      "address": "12 MG Road, Bengaluru",
      "companyName": "Karnataka Infra Pvt Ltd",
      "departmentName": "Operations",
      "designation": "General Manager",
      "referredBy": "District office"
    }
  ]
}
```

#### Get entry by ID

```http
GET /database/{id}
```

**Response `200`:** single entry in `data`.

#### Create entry

```http
POST /database
```

**Request body**

```json
{
  "categoryId": "674a00000000000000000001",
  "prefix": "MR",
  "name": "Ramesh Kumar",
  "contactNumber1": "9876543210",
  "contactNumber2": null,
  "email": "ramesh@example.com",
  "address": "12 MG Road, Bengaluru",
  "companyName": "Karnataka Infra Pvt Ltd",
  "departmentName": "Operations",
  "designation": "General Manager",
  "referredBy": "District office"
}
```

**Response `201`:** created entry in `data` (include `categoryName` when possible).

#### Update entry

```http
PUT /database/{id}
```

**Request body:** same shape as create.

**Response `200`:** updated entry in `data`.

#### Delete entry

```http
DELETE /database/{id}
```

**Response `200`:** success envelope (or `204`).

---

## 3. List page UI (View all)

| Control | Behaviour |
|---------|-----------|
| **Search** | Text input above the table; debounced (~350ms); sends `search` query param |
| **Category** | Searchable dropdown filter; “All categories” sends no `categoryId`; otherwise sends `categoryId` |
| **Add** | Right side of filter row; opens 60% width drawer from the right |

Filters refetch `GET /database` whenever `search` or `categoryId` changes.

Entry drawer includes fields for `companyName`, `departmentName`, and `designation` in addition to existing contact fields.

---

## 4. Frontend file reference

| Area | Path |
|------|------|
| API client | `src/api/database.js` |
| Constants (prefixes) | `src/constants/database.js` |
| Normalize / payload | `src/utils/database.js` |
| List page | `src/dashboard/admin/database/ViewDatabase.jsx` |
| Entry drawer | `src/dashboard/admin/database/DatabaseEntryDrawer.jsx` |
| Category modal | `src/dashboard/admin/database/CategoryNameModal.jsx` |
| Route export | `src/dashboard/admin/Database.jsx` |
| Navigation | `src/config/navigation.js` (`Database` in shared admin/owner items) |
| Routes | `src/routes/AppRoutes.jsx` (`/admin/database`) |
| Searchable select (edit/delete options) | `src/components/common/SearchableSelect.jsx` |
| Drawer size `panel` (60vw) | `src/components/common/Drawer.jsx` |

---

## 5. Backend checklist

- [ ] `GET/POST /database/categories` and `PUT/DELETE /database/categories/:id`
- [ ] `GET/POST /database` and `GET/PUT/DELETE /database/:id`
- [ ] Validate `categoryId` exists on entry create/update
- [ ] Return `categoryName` on entry list/detail responses
- [ ] `GET /database`: optional `search` and `categoryId` query filters
- [ ] Support optional `companyName`, `departmentName`, `designation` on create/update/list/detail
- [ ] `GET /database/categories`: optional `search` query filter
- [ ] `prefix` enum: `MR`, `MRS`, `MISS`, `MASTER`

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-25 | Initial database module |
| 2026-05-25 | List filters: `search`, `categoryId`; drawer 60vw; prefix inline left of name |
| 2026-05-28 | Added optional entry fields: `companyName`, `departmentName`, `designation` |
