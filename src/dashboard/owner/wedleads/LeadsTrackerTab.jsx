import { useCallback, useEffect, useMemo, useState } from "react";
import { getClientLeads } from "../../../api/clientLeads";
import { getApiErrorMessage } from "../../../api/utils";
import DataTable from "../../../components/common/DataTable";
import {
  LEADS_TRACKER_DEFAULT_PAGE_SIZE,
  LEADS_TRACKER_PAGE_SIZE_OPTIONS,
} from "../../../constants/wedLeads";
import { getEntityId } from "../../../utils/entity";
import { getMonthBounds } from "../../../utils/clientLead";

function LeadsTrackerTab() {
  const [monthValue, setMonthValue] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(LEADS_TRACKER_DEFAULT_PAGE_SIZE);

  const queryParams = useMemo(() => {
    const params = {};

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
  }, [monthValue, rangeStart, rangeEnd]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getClientLeads(queryParams);
      setLeads(result.leads);
      setPage(1);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load leads."));
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const hasFilters = Boolean(monthValue || (rangeStart && rangeEnd));

  const clearFilters = () => {
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
      key: "clientDetails",
      label: "Client details",
      className: "min-w-[220px] max-w-[320px]",
      render: (row) => (
        <span className="line-clamp-2" title={row.clientDetails || undefined}>
          {row.clientDetails?.trim() || "—"}
        </span>
      ),
    },
    {
      key: "eventTypeDetails",
      label: "Event type details",
      className: "min-w-[220px] max-w-[320px]",
      render: (row) => (
        <span className="line-clamp-2" title={row.eventTypeDetails || undefined}>
          {row.eventTypeDetails?.trim() || "—"}
        </span>
      ),
    },
  ];

  const tableData = pageRows.map((row, index) => ({
    ...row,
    __sl: pageStart + index + 1,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm shadow-zinc-900/[0.02]">
        <div className="grid gap-3 sm:grid-cols-3">
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
    </div>
  );
}

export default LeadsTrackerTab;
