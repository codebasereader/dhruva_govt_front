import { useCallback, useEffect, useMemo, useState } from "react";
import { getClientLeads, getCoordinators } from "../../../api/clientLeads";
import { getApiErrorMessage } from "../../../api/utils";
import DataTable from "../../../components/common/DataTable";
import SearchableSelect from "../../../components/common/SearchableSelect";
import {
  CLIENT_LEAD_STATUS_OPTIONS,
  CLIENT_LEAD_STATUS_STYLES,
  LEADS_TRACKER_DEFAULT_PAGE_SIZE,
  LEADS_TRACKER_PAGE_SIZE_OPTIONS,
} from "../../../constants/wedLeads";
import { cn } from "../../../utils/cn";
import { getEntityId } from "../../../utils/entity";
import {
  computeBudgetSummaryFromLeads,
  formatAmountINR,
  formatDateDisplay,
  getMonthBounds,
  getNotesDisplay,
  getPersonDisplayName,
} from "../../../utils/clientLead";
import LeadDetailDrawer from "./LeadDetailDrawer";

function SummaryCard({ title, amount, count, accent }) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white px-5 py-4 shadow-sm shadow-zinc-900/[0.02]",
        accent,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
        {formatAmountINR(amount)}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        · {count} lead{count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function StatusCell({ status, converted }) {
  return (
    <div className="space-y-1">
      <span
        className={cn(
          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
          CLIENT_LEAD_STATUS_STYLES[status] ??
            "border-zinc-200 bg-zinc-50 text-zinc-700",
        )}
      >
        {status || "—"}
      </span>
      {converted ? (
        <span className="block text-[11px] font-medium text-emerald-700">
          Converted
        </span>
      ) : null}
    </div>
  );
}

function LeadsTrackerTab() {
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [monthValue, setMonthValue] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const [coordinators, setCoordinators] = useState([]);
  const [loadingCoordinators, setLoadingCoordinators] = useState(true);

  const [leads, setLeads] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(LEADS_TRACKER_DEFAULT_PAGE_SIZE);

  const [viewId, setViewId] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingCoordinators(true);
      try {
        const list = await getCoordinators();
        if (active) setCoordinators(list);
      } catch {
        if (active) setCoordinators([]);
      } finally {
        if (active) setLoadingCoordinators(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const queryParams = useMemo(() => {
    const params = {};
    if (status) params.status = status;
    if (assignedTo) params.assignedTo = assignedTo;

    if (rangeStart && rangeEnd) {
      params.startDate = rangeStart;
      params.endDate = rangeEnd;
      return params;
    }

    if (monthValue) {
      const [y, m] = monthValue.split("-").map(Number);
      const bounds = getMonthBounds(y, m - 1);
      params.startDate = bounds.startDate;
      params.endDate = bounds.endDate;
      params.month = bounds.month;
    }

    return params;
  }, [status, assignedTo, monthValue, rangeStart, rangeEnd]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getClientLeads(queryParams);
      setLeads(result.leads);
      setSummary(result.summary);
      setPage(1);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load leads."));
      setLeads([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const activeRange = useMemo(() => {
    if (rangeStart && rangeEnd) {
      return { start: rangeStart, end: rangeEnd };
    }
    if (monthValue) {
      const [y, m] = monthValue.split("-").map(Number);
      const bounds = getMonthBounds(y, m - 1);
      return { start: bounds.startDate, end: bounds.endDate };
    }
    return { start: "", end: "" };
  }, [rangeStart, rangeEnd, monthValue]);

  const cards = useMemo(() => {
    if (
      summary &&
      (summary.totalEstimatedBudget != null ||
        summary.totalConvertedBudget != null)
    ) {
      return summary;
    }
    return computeBudgetSummaryFromLeads(
      leads,
      activeRange.start,
      activeRange.end,
    );
  }, [summary, leads, activeRange]);

  const hasFilters = Boolean(
    status || assignedTo || monthValue || (rangeStart && rangeEnd),
  );

  const clearFilters = () => {
    setStatus("");
    setAssignedTo("");
    setMonthValue("");
    setRangeStart("");
    setRangeEnd("");
  };

  const handleMonthChange = (value) => {
    setMonthValue(value);
    if (value) {
      setRangeStart("");
      setRangeEnd("");
    }
  };

  const handleRangeStart = (value) => {
    setRangeStart(value);
    if (value) setMonthValue("");
  };

  const handleRangeEnd = (value) => {
    setRangeEnd(value);
    if (value) setMonthValue("");
  };

  const total = leads.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = leads.slice(pageStart, pageStart + pageSize);

  const columns = [
    {
      key: "sl",
      label: "Sl no",
      className: "w-[70px] text-center",
      render: (row) => row.__sl,
    },
    {
      key: "status",
      label: "Status",
      className: "min-w-[120px]",
      render: (row) => (
        <StatusCell
          status={row.status}
          converted={Boolean(row.convertedByMarketing)}
        />
      ),
    },
    {
      key: "estimatedBudget",
      label: "Estimated budget",
      className: "min-w-[140px] text-right tabular-nums",
      render: (row) => formatAmountINR(row.estimatedBudget),
    },
    {
      key: "clientDetails",
      label: "Client details",
      className: "min-w-[200px] max-w-[280px]",
      render: (row) => (
        <span className="line-clamp-2" title={row.clientDetails || undefined}>
          {row.clientDetails?.trim() || "—"}
        </span>
      ),
    },
    {
      key: "eventTypeDetails",
      label: "Event type details",
      className: "min-w-[200px] max-w-[280px]",
      render: (row) => (
        <span className="line-clamp-2" title={row.eventTypeDetails || undefined}>
          {row.eventTypeDetails?.trim() || "—"}
        </span>
      ),
    },
    {
      key: "startDate",
      label: "Start date",
      className: "min-w-[120px] whitespace-nowrap",
      render: (row) => formatDateDisplay(row.startDate),
    },
    {
      key: "endDate",
      label: "End date",
      className: "min-w-[120px] whitespace-nowrap",
      render: (row) => formatDateDisplay(row.endDate),
    },
    {
      key: "assignedTo",
      label: "Assign to",
      className: "min-w-[140px]",
      render: (row) => getPersonDisplayName(row.assignedTo) || "—",
    },
    {
      key: "notes",
      label: "Notes",
      className: "min-w-[220px] max-w-[260px]",
      render: (row) => (
        <span title={row.notes || undefined}>{getNotesDisplay(row.notes)}</span>
      ),
    },
  ];

  const tableData = pageRows.map((row, index) => ({
    ...row,
    __sl: pageStart + index + 1,
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          title="Estimated Budget (pipeline)"
          amount={cards.totalEstimatedBudget}
          count={cards.estimatedLeadsCount}
          accent="border-zinc-200/90"
        />
        <SummaryCard
          title="Successfully Converted Leads"
          amount={cards.totalConvertedBudget}
          count={cards.convertedLeadsCount}
          accent="border-emerald-200/80"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm shadow-zinc-900/[0.02]">
        <div className="grid gap-3 lg:grid-cols-4">
          <div>
            <label
              htmlFor="wed-lead-status"
              className="mb-1 block text-xs font-medium text-zinc-600"
            >
              Status
            </label>
            <select
              id="wed-lead-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            >
              <option value="">All statuses</option>
              {CLIENT_LEAD_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <SearchableSelect
            id="wed-lead-coordinator"
            label="Coordinator"
            value={assignedTo}
            onChange={setAssignedTo}
            options={[{ value: "", label: "All coordinators" }, ...coordinators]}
            placeholder="All coordinators"
            loading={loadingCoordinators}
          />

          <div>
            <label
              htmlFor="wed-lead-month"
              className="mb-1 block text-xs font-medium text-zinc-600"
            >
              Month (by start date)
            </label>
            <input
              id="wed-lead-month"
              type="month"
              value={monthValue}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="wed-lead-range-start"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Start from
              </label>
              <input
                id="wed-lead-range-start"
                type="date"
                value={rangeStart}
                max={rangeEnd || undefined}
                onChange={(e) => handleRangeStart(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
              />
            </div>
            <div>
              <label
                htmlFor="wed-lead-range-end"
                className="mb-1 block text-xs font-medium text-zinc-600"
              >
                Start to
              </label>
              <input
                id="wed-lead-range-end"
                type="date"
                value={rangeEnd}
                min={rangeStart || undefined}
                onChange={(e) => handleRangeEnd(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="cursor-pointer rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear filters
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <DataTable
        columns={columns}
        data={tableData}
        loading={loading}
        emptyMessage={hasFilters ? "No leads match your filters." : "No leads yet."}
        rowKey={(row) => getEntityId(row)}
        renderActions={(row) => (
          <button
            type="button"
            onClick={() => setViewId(getEntityId(row))}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            View
          </button>
        )}
      />

      {!loading && total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
          <p>
            {total} lead{total === 1 ? "" : "s"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Rows
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
              >
                {LEADS_TRACKER_PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="cursor-pointer rounded-full border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2 tabular-nums">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="cursor-pointer rounded-full border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <LeadDetailDrawer
        open={Boolean(viewId)}
        onClose={() => setViewId(null)}
        leadId={viewId}
      />
    </div>
  );
}

export default LeadsTrackerTab;
