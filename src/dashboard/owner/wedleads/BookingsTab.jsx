import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getClientBookingVenues,
  getClientBookings,
} from "../../../api/clientBookings";
import { getApiErrorMessage } from "../../../api/utils";
import DataTable from "../../../components/common/DataTable";
import SearchableSelect from "../../../components/common/SearchableSelect";
import {
  BOOKINGS_DEFAULT_PAGE_SIZE,
  BOOKINGS_PAGE_SIZE_OPTIONS,
  CLIENT_BOOKINGS_STATUS_TABS,
  EVENT_CONFIRMATION_STYLES,
} from "../../../constants/clientBookings";
import { FINANCE_SOURCE_TYPES } from "../../../constants/finance";
import { cn } from "../../../utils/cn";
import { getEntityId } from "../../../utils/entity";
import { getEventName, getTabLabelBookingCount } from "../../../utils/clientBooking";
import { buildBudgetReportPath } from "./finance/budgetReportRoute";
import BudgetReportClonePickerModal from "./finance/BudgetReportClonePickerModal";
import BudgetReportDrawer from "./finance/BudgetReportDrawer";
import ClientFinanceDrawer from "./finance/ClientFinanceDrawer";
import FinanceActionsCell from "./finance/FinanceActionsCell";
import { buildFinanceColumns } from "./finance/financeColumns";
import { useSourceFinanceLookup } from "./finance/useSourceFinanceLookup";

const SOURCE_TYPE = FINANCE_SOURCE_TYPES.BOOKING;

function bookingSourceLabel(row) {
  return row?.clientName?.trim() || getEventName(row?.eventName) || "Booking";
}

function ConfirmationTag({ value }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        EVENT_CONFIRMATION_STYLES[value] ??
          "border-zinc-200 bg-zinc-50 text-zinc-700",
      )}
    >
      {value || "—"}
    </span>
  );
}

function BookingsTab() {
  const navigate = useNavigate();
  const [listStatusTab, setListStatusTab] = useState("all");
  const [eventName, setEventName] = useState("");
  const [venueId, setVenueId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [knownEventNames, setKnownEventNames] = useState([]);

  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(true);

  const [events, setEvents] = useState([]);
  const [totalsByStatus, setTotalsByStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(BOOKINGS_DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingVenues(true);
      try {
        const list = await getClientBookingVenues();
        if (active) setVenues(list);
      } catch {
        if (active) setVenues([]);
      } finally {
        if (active) setLoadingVenues(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getClientBookings({
        page,
        limit: pageSize,
        listStatusTab,
        eventName: eventName || undefined,
        venueId: venueId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setEvents(result.events);
      setTotalsByStatus(result.totalsByStatus);
      setTotal(result.total);
      setKnownEventNames((prev) => {
        const next = new Set(prev);
        result.events.forEach((ev) => {
          const name = getEventName(ev.eventName);
          if (name && name !== "N/A") next.add(name);
        });
        return Array.from(next).sort((a, b) => a.localeCompare(b));
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load bookings."));
      setEvents([]);
      setTotalsByStatus(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, listStatusTab, eventName, venueId, startDate, endDate]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const bookingIds = useMemo(() => events.map((row) => getEntityId(row)), [events]);
  const { financeMap, reportMap, refetch: refetchFinance } =
    useSourceFinanceLookup({ sourceType: SOURCE_TYPE, ids: bookingIds });

  const [financeDrawer, setFinanceDrawer] = useState({ open: false, row: null, readOnly: false });
  const [budgetDrawer, setBudgetDrawer] = useState({ open: false, row: null });
  const [clonePicker, setClonePicker] = useState({ open: false, row: null });

  const goToBudgetReport = (row) =>
    navigate(
      buildBudgetReportPath({
        sourceType: SOURCE_TYPE,
        sourceId: getEntityId(row),
        sourceLabel: bookingSourceLabel(row),
      }),
    );

  const resetPage = () => setPage(1);

  const hasFilters = Boolean(eventName || venueId || startDate || endDate);

  const clearFilters = () => {
    setEventName("");
    setVenueId("");
    setStartDate("");
    setEndDate("");
    resetPage();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const columns = useMemo(
    () => [
      {
        key: "eventConfirmation",
        label: "Event Confirmation",
        className: "min-w-[140px]",
        render: (row) => <ConfirmationTag value={row.eventConfirmation} />,
      },
      {
        key: "eventName",
        label: "Event Name",
        className: "min-w-[120px]",
        render: (row) => (
          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800">
            {getEventName(row.eventName)}
          </span>
        ),
      },
      {
        key: "clientDetails",
        label: "Client Details",
        className: "min-w-[160px]",
        render: (row) => (
          <div>
            <p className="font-medium text-zinc-800">{row.clientName || "—"}</p>
            {row.brideName && row.groomName ? (
              <p className="text-xs text-zinc-500">Bride & Groom</p>
            ) : null}
          </div>
        ),
      },
      {
        key: "contact",
        label: "Contact",
        className: "min-w-[120px]",
        render: (row) => (
          <div className="text-sm">
            <p>{row.contactNumber || "—"}</p>
            {row.altContactNumber &&
            row.altContactNumber !== row.contactNumber ? (
              <p className="text-xs text-zinc-500">{row.altContactNumber}</p>
            ) : null}
          </div>
        ),
      },
      ...buildFinanceColumns({
        financeMap,
        reportMap,
        getSourceId: (row) => getEntityId(row),
        onAddReport: goToBudgetReport,
        onEditReport: goToBudgetReport,
        onCloneReport: (row) => setClonePicker({ open: true, row }),
        onViewReport: (row) => setBudgetDrawer({ open: true, row }),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [financeMap, reportMap],
  );

  const eventNameOptions = useMemo(
    () => [
      { value: "", label: "All event names" },
      ...knownEventNames.map((name) => ({ value: name, label: name })),
    ],
    [knownEventNames],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm shadow-zinc-900/[0.02]">
        <div className="grid gap-3 lg:grid-cols-4">
          <SearchableSelect
            id="booking-event-name"
            label="Event name"
            value={eventName}
            onChange={(v) => {
              setEventName(v);
              resetPage();
            }}
            options={eventNameOptions}
            placeholder="All event names"
          />

          <SearchableSelect
            id="booking-venue"
            label="Venue"
            value={venueId}
            onChange={(v) => {
              setVenueId(v);
              resetPage();
            }}
            options={[{ value: "", label: "All venues" }, ...venues]}
            placeholder="All venues"
            loading={loadingVenues}
          />

          <div>
            <label
              htmlFor="booking-start"
              className="mb-1 block text-xs font-medium text-zinc-600"
            >
              Start date
            </label>
            <input
              id="booking-start"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => {
                setStartDate(e.target.value);
                resetPage();
              }}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="booking-end"
              className="mb-1 block text-xs font-medium text-zinc-600"
            >
              End date
            </label>
            <input
              id="booking-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => {
                setEndDate(e.target.value);
                resetPage();
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

      <div
        role="tablist"
        aria-label="Booking status"
        className="flex flex-wrap gap-2"
      >
        {CLIENT_BOOKINGS_STATUS_TABS.map((tab) => {
          const count = getTabLabelBookingCount(totalsByStatus, tab.key);
          const active = listStatusTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setListStatusTab(tab.key);
                resetPage();
              }}
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
              )}
            >
              {tab.label}
              {count != null ? (
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    active ? "text-zinc-300" : "text-zinc-400",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <DataTable
        columns={columns}
        data={events}
        loading={loading}
        emptyMessage={
          hasFilters || listStatusTab !== "all"
            ? "No bookings match your filters."
            : "No bookings yet."
        }
        rowKey={(row) => getEntityId(row)}
        renderActions={(row) => (
          <FinanceActionsCell
            onView={() => setFinanceDrawer({ open: true, row, readOnly: true })}
            onEdit={() => setFinanceDrawer({ open: true, row, readOnly: false })}
          />
        )}
      />

      {!loading && total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
          <p>
            Showing {from}-{to} of {total} bookings
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
                  resetPage();
                }}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
              >
                {BOOKINGS_PAGE_SIZE_OPTIONS.map((n) => (
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

      <ClientFinanceDrawer
        open={financeDrawer.open}
        onClose={() => setFinanceDrawer({ open: false, row: null, readOnly: false })}
        sourceType={SOURCE_TYPE}
        sourceId={financeDrawer.row ? getEntityId(financeDrawer.row) : null}
        financeRecord={
          financeDrawer.row ? financeMap[getEntityId(financeDrawer.row)] : null
        }
        readOnly={financeDrawer.readOnly}
        onSaved={refetchFinance}
      />

      <BudgetReportDrawer
        open={budgetDrawer.open}
        onClose={() => setBudgetDrawer({ open: false, row: null })}
        sourceType={SOURCE_TYPE}
        sourceId={budgetDrawer.row ? getEntityId(budgetDrawer.row) : null}
        sourceLabel={budgetDrawer.row ? bookingSourceLabel(budgetDrawer.row) : ""}
      />

      <BudgetReportClonePickerModal
        open={clonePicker.open}
        onClose={() => setClonePicker({ open: false, row: null })}
        sourceType={SOURCE_TYPE}
        sourceId={clonePicker.row ? getEntityId(clonePicker.row) : null}
        sourceLabel={clonePicker.row ? bookingSourceLabel(clonePicker.row) : ""}
        onCloned={() => {
          const row = clonePicker.row;
          setClonePicker({ open: false, row: null });
          refetchFinance();
          if (row) goToBudgetReport(row);
        }}
      />
    </div>
  );
}

export default BookingsTab;
