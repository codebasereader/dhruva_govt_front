import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteDatabaseEntry,
  getDatabaseCategories,
  getDatabaseEntries,
} from "../../../api/database";
import { getApiErrorMessage } from "../../../api/utils";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable from "../../../components/common/DataTable";
import PageHeader from "../../../components/common/PageHeader";
import SearchableSelect from "../../../components/common/SearchableSelect";
import TableActions from "../../../components/common/TableActions";
import { useFetchList } from "../../../hooks/useFetchList";
import {
  formatDatabaseFullName,
  normalizeDatabaseCategory,
  normalizeDatabaseEntry,
} from "../../../utils/database";
import { getEntityId } from "../../../utils/entity";
import DatabaseEntryDrawer from "./DatabaseEntryDrawer";

const btnAdd =
  "cursor-pointer rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2";

function ViewDatabase() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingCategories(true);
      try {
        const list = await getDatabaseCategories();
        if (active) setCategories(list.map(normalizeDatabaseCategory));
      } catch {
        if (active) setCategories([]);
      } finally {
        if (active) setLoadingCategories(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const fetchEntries = useCallback(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (filterCategoryId) params.categoryId = filterCategoryId;
    return getDatabaseEntries(params);
  }, [debouncedSearch, filterCategoryId]);

  const {
    data: entries,
    loading,
    error: listError,
    reload: load,
    setError: setListError,
  } = useFetchList(fetchEntries, "Failed to load database entries.");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const categoryFilterOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  );

  const normalized = entries.map(normalizeDatabaseEntry);

  const hasFilters = Boolean(debouncedSearch || filterCategoryId);

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDatabaseEntry(getEntityId(deleteTarget));
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setListError(getApiErrorMessage(err, "Failed to delete entry."));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <span className="font-medium text-zinc-900">{formatDatabaseFullName(row)}</span>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row) => row.categoryName || "—",
    },
    {
      key: "contactNumber1",
      label: "Contact 1",
      render: (row) => row.contactNumber1 || "—",
    },
    {
      key: "contactNumber2",
      label: "Contact 2",
      render: (row) => row.contactNumber2 || "—",
    },
    {
      key: "email",
      label: "Email",
      render: (row) => row.email || "—",
    },
    {
      key: "address",
      label: "Address",
      className: "max-w-[200px]",
      render: (row) => (
        <span className="line-clamp-2 whitespace-normal">{row.address || "—"}</span>
      ),
    },
    {
      key: "companyName",
      label: "Company",
      className: "max-w-[180px]",
      render: (row) => (
        <span className="line-clamp-2 whitespace-normal">{row.companyName || "—"}</span>
      ),
    },
    {
      key: "departmentName",
      label: "Department",
      className: "max-w-[180px]",
      render: (row) => (
        <span className="line-clamp-2 whitespace-normal">{row.departmentName || "—"}</span>
      ),
    },
    {
      key: "designation",
      label: "Designation",
      render: (row) => row.designation || "—",
    },
    {
      key: "referredBy",
      label: "Referred by",
      render: (row) => row.referredBy || "—",
    },
  ];

  return (
    <article>
      <PageHeader
        title="Database"
        description="View and manage contacts with categories and referral details."
      />

      {listError ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {listError}
        </p>
      ) : null}

      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
          <div>
            <label htmlFor="db-list-search" className="mb-1 block text-xs font-medium text-zinc-600">
              Search
            </label>
            <input
              id="db-list-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, company, dept, designation, email, phone…"
              className={inputClass}
            />
          </div>
          <SearchableSelect
            id="db-list-category"
            label="Category"
            value={filterCategoryId}
            onChange={setFilterCategoryId}
            options={categoryFilterOptions}
            placeholder="All categories"
            loading={loadingCategories}
          />
        </div>
        <button type="button" onClick={openAdd} className={btnAdd}>
          Add
        </button>
      </div>

      <DataTable
        columns={columns}
        data={normalized}
        loading={loading}
        emptyMessage={
          hasFilters ? "No entries match the current filters." : "No entries yet. Click Add to create one."
        }
        rowKey={(row) => row.id}
        renderActions={(row) => (
          <TableActions
            onEdit={() => openEdit(row)}
            onDelete={() => setDeleteTarget(row)}
          />
        )}
      />

      <DatabaseEntryDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        entry={editing}
        onSaved={() => {
          closeDrawer();
          load();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete entry"
        message={`Delete "${formatDatabaseFullName(normalizeDatabaseEntry(deleteTarget ?? {}))}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </article>
  );
}

export default ViewDatabase;
