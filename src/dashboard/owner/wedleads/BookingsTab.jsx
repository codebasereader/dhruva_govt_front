import { useCallback, useEffect, useMemo, useState } from "react";
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
import { cn } from "../../../utils/cn";
import { getEntityId } from "../../../utils/entity";
import {
  formatBookingAmount,
  formatBookingDate,
  getBookedByDisplay,
  getBookingReceivedAmount,
  getEventName,
  getEventsListTotalsBucket,
  getPaymentCollectedPercent,
  getPersonName,
  getTabLabelBookingCount,
  getTotalPayable,
} from "../../../utils/clientBooking";
import BookingDetailDrawer from "./BookingDetailDrawer";

function StatCard({ label, amount, count, hint }) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white px-4 py-4 shadow-sm shadow-zinc-900/[0.02]">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      {amount != null ? (
        <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 tabular-nums">
          {formatBookingAmount(amount)}
        </p>
      ) : null}
      {count != null ? (
        <p className="mt-1 text-sm text-zinc-500">
          {count} booking{count === 1 ? "" : "s"}
        </p>
      ) : null}
      {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
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

function PaymentStatusCell({ booked, received }) {
  const balance = Math.max(booked - received, 0);
  const pct = getPaymentCollectedPercent(booked, received);
  const tagClass =
    pct >= 100
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : pct > 0
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-zinc-200 bg-zinc-50 text-zinc-600";

  return (
    <div className="space-y-1 text-sm">
      <p>
        Received{" "}
        <span className="font-medium tabular-nums">
          {formatBookingAmount(received)}
        </span>
      </p>
      <p className="text-zinc-500">
        Balance{" "}
        <span className="tabular-nums">{formatBookingAmount(balance)}</span>
      </p>
      <span
        className={cn(
          "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
          tagClass,
        )}
      >
        {pct}% collected
      </span>
    </div>
  );
}

function BookingsTab() {
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

  const [selectedBooking, setSelectedBooking] = useState(null);

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

  const resetPage = () => setPage(1);

  const hasFilters = Boolean(eventName || venueId || startDate || endDate);

  const clearFilters = () => {
    setEventName("");
    setVenueId("");
    setStartDate("");
    setEndDate("");
    resetPage();
  };

  const showMeetingDate =
    listStatusTab === "inprogress" || listStatusTab === "cancelled";

  const stats = useMemo(() => {
    const all = getEventsListTotalsBucket(totalsByStatus, "all");
    const confirmed = getEventsListTotalsBucket(totalsByStatus, "confirmed");
    const inprogress = getEventsListTotalsBucket(totalsByStatus, "inprogress");
    const cancelled = getEventsListTotalsBucket(totalsByStatus, "cancelled");

    if (listStatusTab === "confirmed") {
      return [
        {
          label: "Total expected",
          amount: confirmed?.totalExpectedAmount ?? 0,
          count: confirmed?.totalBookingsNumber,
        },
        {
          label: "Total received",
          amount: confirmed?.totalReceivedAmount ?? 0,
          hint:
            confirmed?.bookingsWithAnyReceiptCount != null
              ? `${confirmed.bookingsWithAnyReceiptCount} where payment started`
              : undefined,
        },
        {
          label: "Total balance",
          amount: confirmed?.totalBalanceAmount ?? 0,
          hint:
            confirmed?.bookingsWithOutstandingBalanceCount != null
              ? `${confirmed.bookingsWithOutstandingBalanceCount} not fully settled`
              : undefined,
        },
      ];
    }

    if (listStatusTab === "inprogress") {
      return [
        {
          label: "In progress bookings",
          count: inprogress?.totalBookingsNumber ?? 0,
        },
        {
          label: "Total expected",
          amount: inprogress?.totalExpectedAmount ?? 0,
        },
      ];
    }

    if (listStatusTab === "cancelled") {
      return [
        {
          label: "Cancelled bookings",
          count: cancelled?.totalBookingsNumber ?? 0,
        },
        {
          label: "Total expected",
          amount: cancelled?.totalExpectedAmount ?? 0,
        },
      ];
    }

    return [
      {
        label: "Total expected",
        amount: all?.totalExpectedAmount ?? 0,
        count: all?.totalBookingsNumber,
      },
      {
        label: "Confirmed — total business",
        amount: all?.confirmedTotalExpectedAmount ?? 0,
        count: all?.confirmedTotalBookingsNumber,
      },
      {
        label: "In progress — total business",
        amount: all?.pendingTotalExpectedAmount ?? 0,
        count: all?.pendingTotalBookingsNumber,
      },
    ];
  }, [totalsByStatus, listStatusTab]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const columns = useMemo(() => {
    const cols = [
      {
        key: "bookedBy",
        label: "Booked By",
        className: "min-w-[140px]",
        render: (row) => getBookedByDisplay(row),
      },
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
    ];

    if (showMeetingDate) {
      cols.push({
        key: "meetingDate",
        label: "Next Meeting Date",
        className: "min-w-[140px] whitespace-nowrap",
        render: (row) =>
          row.meetingDate ? formatBookingDate(row.meetingDate) : "Not Set",
      });
    }

    cols.push(
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
      {
        key: "leads",
        label: "Leads",
        className: "min-w-[120px]",
        render: (row) => {
          const l1 = getPersonName(row.lead1);
          const l2 = getPersonName(row.lead2);
          if (!l1 && !l2) return "No leads";
          return [l1, l2].filter(Boolean).join(" / ");
        },
      },
      {
        key: "bookedAmount",
        label: "Booked Amount",
        className: "min-w-[120px] text-right tabular-nums",
        render: (row) => formatBookingAmount(getTotalPayable(row)),
      },
      {
        key: "paymentStatus",
        label: "Payment Status",
        className: "min-w-[150px]",
        render: (row) => {
          const booked = getTotalPayable(row);
          const received = getBookingReceivedAmount(row);
          return <PaymentStatusCell booked={booked} received={received} />;
        },
      },
      {
        key: "eventTypes",
        label: "Event Types",
        className: "min-w-[110px] text-center",
        render: (row) => {
          const n = row.eventTypes?.length ?? 0;
          return (
            <button
              type="button"
              onClick={() => setSelectedBooking(row)}
              className="cursor-pointer rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              View ({n})
            </button>
          );
        },
      },
    );

    return cols;
  }, [showMeetingDate]);

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

      <div
        className={cn(
          "grid gap-3",
          stats.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        {stats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
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

      <BookingDetailDrawer
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
      />
    </div>
  );
}

export default BookingsTab;
