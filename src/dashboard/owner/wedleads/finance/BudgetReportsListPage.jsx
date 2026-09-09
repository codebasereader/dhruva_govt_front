import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchBudgetReports } from "../../../../api/budgetReports";
import { getApiErrorMessage } from "../../../../api/utils";
import DataTable from "../../../../components/common/DataTable";
import PageHeader from "../../../../components/common/PageHeader";
import {
  BUDGET_REPORTS_DEFAULT_PAGE_SIZE,
  BUDGET_REPORTS_PAGE_SIZE_OPTIONS,
  FINANCE_SOURCE_TYPE_LABELS,
  FINANCE_SOURCE_TYPE_OPTIONS,
  FINANCE_SOURCE_TYPE_STYLES,
} from "../../../../constants/finance";
import { cn } from "../../../../utils/cn";
import BudgetReportDrawer from "./BudgetReportDrawer";
import { buildBudgetReportPath } from "./budgetReportRoute";

function SourceTypeTag({ value }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        FINANCE_SOURCE_TYPE_STYLES[value] ??
          "border-zinc-200 bg-zinc-50 text-zinc-700",
      )}
    >
      {FINANCE_SOURCE_TYPE_LABELS[value] ?? value}
    </span>
  );
}

function BudgetReportsListPage() {
  const navigate = useNavigate();
  const [sourceType, setSourceType] = useState("");
  const [search, setSearch] = useState("");
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(BUDGET_REPORTS_DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewDrawer, setViewDrawer] = useState({ open: false, item: null });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await searchBudgetReports({
        sourceType: sourceType || undefined,
        search: search || undefined,
        updatedFrom: updatedFrom || undefined,
        updatedTo: updatedTo || undefined,
        page,
        limit: pageSize,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load budget reports."));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [sourceType, search, updatedFrom, updatedTo, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasFilters = Boolean(sourceType || search || updatedFrom || updatedTo);

  const clearFilters = () => {
    setSourceType("");
    setSearch("");
    setUpdatedFrom("");
    setUpdatedTo("");
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  const columns = [
    {
      key: "sourceType",
      label: "Type",
      className: "min-w-[100px]",
      render: (row) => <SourceTypeTag value={row.sourceType} />,
    },
    {
      key: "sourceLabel",
      label: "Client / Event",
      className: "min-w-[220px] max-w-[360px]",
      render: (row) => (
        <span className="line-clamp-2">{row.sourceLabel || "Untitled"}</span>
      ),
    },
    {
      key: "updatedAt",
      label: "Last updated",
      className: "min-w-[160px] whitespace-nowrap",
      render: (row) =>
        row.updatedAt ? new Date(row.updatedAt).toLocaleString("en-IN") : "—",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Budget Reports"
        description="Every budget report across leads and bookings, in one place."
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm shadow-zinc-900/[0.02]">
        <div className="grid gap-3 lg:grid-cols-4">
          <div>
            <label
              htmlFor="br-source-type"
              className="mb-1 block text-xs font-medium text-zinc-600"
            >
              Type
            </label>
            <select
              id="br-source-type"
              value={sourceType}
              onChange={(e) => {
                setSourceType(e.target.value);
                setPage(1);
              }}
              className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            >
              {FINANCE_SOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="br-search"
              className="mb-1 block text-xs font-medium text-zinc-600"
            >
              Search
            </label>
            <input
              id="br-search"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Client / event name"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="br-updated-from"
              className="mb-1 block text-xs font-medium text-zinc-600"
            >
              Updated from
            </label>
            <input
              id="br-updated-from"
              type="date"
              value={updatedFrom}
              max={updatedTo || undefined}
              onChange={(e) => {
                setUpdatedFrom(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="br-updated-to"
              className="mb-1 block text-xs font-medium text-zinc-600"
            >
              Updated to
            </label>
            <input
              id="br-updated-to"
              type="date"
              value={updatedTo}
              min={updatedFrom || undefined}
              onChange={(e) => {
                setUpdatedTo(e.target.value);
                setPage(1);
              }}
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
        data={items}
        loading={loading}
        emptyMessage={
          hasFilters
            ? "No budget reports match your filters."
            : "No budget reports yet."
        }
        rowKey={(row) => row.id}
        renderActions={(row) => (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => setViewDrawer({ open: true, item: row })}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              View
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(
                  buildBudgetReportPath({
                    sourceType: row.sourceType,
                    sourceId: row.sourceId,
                    sourceLabel: row.sourceLabel,
                  }),
                )
              }
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              Edit
            </button>
          </div>
        )}
      />

      {!loading && total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
          <p>
            {total} budget report{total === 1 ? "" : "s"}
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
                {BUDGET_REPORTS_PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="cursor-pointer rounded-full border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2 tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="cursor-pointer rounded-full border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BudgetReportDrawer
        open={viewDrawer.open}
        onClose={() => setViewDrawer({ open: false, item: null })}
        sourceType={viewDrawer.item?.sourceType}
        sourceId={viewDrawer.item?.sourceId}
        sourceLabel={viewDrawer.item?.sourceLabel}
      />
    </div>
  );
}

export default BudgetReportsListPage;
