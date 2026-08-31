import { useCallback, useEffect, useState } from "react";
import { deleteMyLead, getMyLeads } from "../../../api/myLeads";
import { getApiErrorMessage } from "../../../api/utils";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DataTable from "../../../components/common/DataTable";
import PageHeader from "../../../components/common/PageHeader";
import TableActions from "../../../components/common/TableActions";
import {
  getMyLeadStatusLabel,
  MY_LEAD_MEETING_STATUS_OPTIONS,
  MY_LEAD_MEETING_STATUS_STYLES,
} from "../../../constants/myLeads";
import { useFetchList } from "../../../hooks/useFetchList";
import { cn } from "../../../utils/cn";
import { getEntityId } from "../../../utils/entity";
import { formatMeetingDate } from "../../../utils/myLead";
import MyLeadDrawer from "./MyLeadDrawer";

function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        MY_LEAD_MEETING_STATUS_STYLES[status] ??
          "border-zinc-200 bg-zinc-50 text-zinc-700",
      )}
    >
      {getMyLeadStatusLabel(status)}
    </span>
  );
}

function ViewMyLeads() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(id);
  }, [search]);

  const fetchLeads = useCallback(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter) params.meetingStatus = statusFilter;
    return getMyLeads(params);
  }, [debouncedSearch, statusFilter]);

  const {
    data: leads,
    loading,
    error: listError,
    reload: load,
    setError: setListError,
  } = useFetchList(fetchLeads, "Failed to load leads.");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleting, setDeleting] = useState(false);

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

  const requestDelete = (row) => {
    setDeleteTarget(row);
    setDeleteStep(1);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setDeleteStep(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }

    setDeleting(true);
    try {
      await deleteMyLead(getEntityId(deleteTarget));
      cancelDelete();
      await load();
    } catch (err) {
      setListError(getApiErrorMessage(err, "Failed to delete lead."));
      cancelDelete();
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "clientName",
      label: "Client name",
      render: (row) => row.clientName || "—",
    },
    {
      key: "phoneNumber",
      label: "Phone",
      render: (row) => row.phoneNumber || "—",
    },
    {
      key: "alternativeNumber",
      label: "Alt. number",
      render: (row) => row.alternativeNumber || "—",
    },
    {
      key: "meetingStatus",
      label: "Status",
      render: (row) => <StatusBadge status={row.meetingStatus} />,
    },
    {
      key: "meetings",
      label: "Meetings",
      render: (row) => {
        const count = row.meetings?.length ?? 0;
        if (!count) return "—";
        const latest = [...row.meetings].sort((a, b) =>
          String(b.meetingDate).localeCompare(String(a.meetingDate)),
        )[0];
        return (
          <span className="text-zinc-700">
            {count} · last {formatMeetingDate(latest?.meetingDate)}
          </span>
        );
      },
    },
  ];

  const deleteName = deleteTarget?.clientName?.trim() || "this lead";

  return (
    <>
      <article>
        <PageHeader
          title="My leads"
          description="Track client leads, meeting status, and meeting history."
        />

        {listError ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </p>
        ) : null}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <label
                htmlFor="my-leads-search"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Search
              </label>
              <input
                id="my-leads-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Client name or phone…"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
              />
            </div>
            <div className="sm:w-48">
              <label
                htmlFor="my-leads-status"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Status
              </label>
              <select
                id="my-leads-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
              >
                <option value="">All statuses</option>
                {MY_LEAD_MEETING_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="cursor-pointer self-end rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2"
          >
            Add lead
          </button>
        </div>

        <DataTable
          columns={columns}
          data={leads}
          loading={loading}
          emptyMessage={
            debouncedSearch || statusFilter
              ? "No leads match your filters."
              : "No leads yet."
          }
          rowKey={(row) => getEntityId(row)}
          renderActions={(row) => (
            <TableActions
              onEdit={() => openEdit(row)}
              onDelete={() => requestDelete(row)}
            />
          )}
        />
      </article>

      <MyLeadDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        lead={editing}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget) && deleteStep === 1}
        title="Delete lead?"
        message={`Do you want to delete "${deleteName}"?`}
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={cancelDelete}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget) && deleteStep === 2}
        title="Confirm delete"
        message={`This permanently removes "${deleteName}" and all meeting history. This cannot be undone.`}
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={cancelDelete}
        loading={deleting}
      />
    </>
  );
}

export default ViewMyLeads;
