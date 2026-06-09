import { useEffect, useState } from "react";
import { getBusinessPlanList } from "../../../api/buisnessplan";
import { getApiErrorMessage } from "../../../api/utils";
import Drawer from "../../../components/common/Drawer";
import SearchableSelect from "../../../components/common/SearchableSelect";
import {
  EVENT_TYPE_STYLES,
  EVENT_TYPES,
  PLAN_TAB_TYPES,
  PLAN_TABS,
  RECURRENCE_TYPES,
} from "../../../constants/businessPlan";
import { cn } from "../../../utils/cn";
import {
  formatAmountCell,
  formatBelongsToLabel,
  formatEventDateLabel,
  formatEventTypeLabel,
  formatVenueLabel,
  getAnchorYearFromDate,
  normalizeBusinessPlanEvent,
  resolveEventForCalendarYear,
} from "../../../utils/businessPlanEvent";
import { getEntityId } from "../../../utils/entity";

const thClass =
  "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500";
const tdClass = "whitespace-nowrap px-4 py-3.5 text-sm text-zinc-700";
const tdWrapLong =
  "px-4 py-3.5 text-sm text-zinc-700 align-top whitespace-normal break-words [overflow-wrap:anywhere] min-w-[120px] max-w-[220px]";

function EventTypeBadge({ eventType }) {
  const style = EVENT_TYPE_STYLES[eventType];
  const label = formatEventTypeLabel(eventType);
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        style?.bg,
        style?.text,
        style?.border,
      )}
    >
      {label}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">{value}</p>
    </div>
  );
}

function listAmountYear(calendarYear, filterStartDate, row) {
  if (calendarYear != null) return calendarYear;
  if (filterStartDate) {
    const y = Number(String(filterStartDate).slice(0, 4));
    if (Number.isFinite(y)) return y;
  }
  return getAnchorYearFromDate(row.startDate ?? row.date) ?? new Date().getFullYear();
}

function resolveListEvent(row, calendarYear, filterStartDate) {
  const n = normalizeBusinessPlanEvent(row);
  if (n.recurrenceType !== RECURRENCE_TYPES.YEARLY) return n;
  return resolveEventForCalendarYear(n, listAmountYear(calendarYear, filterStartDate, n));
}

function BusinessPlanListDrawer({
  open,
  onClose,
  districts = [],
  departments = [],
  loadingFilterOptions = false,
  refreshKey = 0,
  calendarYear = null,
}) {
  const [activeTab, setActiveTab] = useState(PLAN_TAB_TYPES.ALL);
  const [filterDistrictId, setFilterDistrictId] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) return;
    setActiveTab(PLAN_TAB_TYPES.ALL);
    setFilterDistrictId("");
    setFilterDepartmentId("");
    setSearch("");
    setDebouncedSearch("");
    setStartDate("");
    setEndDate("");
  }, [open]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (filterDistrictId) params.districtId = filterDistrictId;
        if (filterDepartmentId) params.departmentId = filterDepartmentId;
        if (activeTab !== PLAN_TAB_TYPES.ALL) params.type = activeTab;

        const { events: list, stats: nextStats } = await getBusinessPlanList(params);

        if (!cancelled) {
          setEvents(
            list.map((row) => resolveListEvent(row, calendarYear, startDate)),
          );
          setStats(nextStats);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Failed to load event list."));
          setEvents([]);
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    debouncedSearch,
    startDate,
    endDate,
    filterDistrictId,
    filterDepartmentId,
    activeTab,
    refreshKey,
    calendarYear,
  ]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Event list"
      description="Search and filter events across all dates."
      size="wide"
    >
      <div className="mb-6 space-y-4">
        <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50/80 p-1">
          {PLAN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="bp-list-search" className="mb-1 block text-xs font-medium text-zinc-600">
              Search event
            </label>
            <input
              id="bp-list-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Event name…"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="bp-list-start" className="mb-1 block text-xs font-medium text-zinc-600">
              From date
            </label>
            <input
              id="bp-list-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="bp-list-end" className="mb-1 block text-xs font-medium text-zinc-600">
              To date
            </label>
            <input
              id="bp-list-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <SearchableSelect
              id="bp-list-district"
              label="District"
              value={filterDistrictId}
              onChange={setFilterDistrictId}
              placeholder="All districts"
              loading={loadingFilterOptions}
              options={[
                { value: "", label: "All districts" },
                ...districts.map((d) => ({
                  value: getEntityId(d),
                  label: d.name,
                })),
              ]}
            />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <SearchableSelect
              id="bp-list-department"
              label="Department"
              value={filterDepartmentId}
              onChange={setFilterDepartmentId}
              placeholder="All departments"
              loading={loadingFilterOptions}
              options={[
                { value: "", label: "All departments" },
                ...departments.map((d) => ({
                  value: getEntityId(d),
                  label: d.name,
                })),
              ]}
            />
          </div>
        </div>

        {stats && !loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total events" value={stats.totalEvents ?? 0} />
            {/* <StatCard
              label="Total amount"
              value={formatAmountCell(stats.totalAmount)}
            /> */}
            <StatCard
              label="Current year total"
              value={formatAmountCell(stats.totalCurrentYearAmount)}
            />
            <StatCard
              label="Previous year total"
              value={formatAmountCell(stats.totalPreviousYearAmount)}
            />
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="py-12 text-center text-sm text-zinc-400">Loading events…</p>
      ) : !events.length ? (
        <p className="py-12 text-center text-sm text-zinc-400">
          No events match the current filters.
        </p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80">
                <th className={thClass}>Date</th>
                <th className={thClass}>Event</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Belongs to</th>
                <th className={thClass}>District</th>
                <th className={thClass}>Department</th>
                <th className={thClass}>Venue</th>
                <th className={cn(thClass, "text-right")}>Prev. year</th>
                <th className={cn(thClass, "text-right")}>Curr. year</th>
                <th className={cn(thClass, "text-right")}>MCA 5%</th>
                <th className={cn(thClass, "text-right")}>GST %</th>
                <th className={cn(thClass, "text-right")}>GST amt.</th>
                <th className={cn(thClass, "text-right")}>Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {events.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50/80">
                  <td className={tdClass}>
                    {formatEventDateLabel(row.startDate ?? row.date, row.endDate)}
                  </td>
                  <td className={cn(tdClass, "max-w-[200px] font-medium text-zinc-900")}>
                    <span className="line-clamp-2">{row.eventName || "—"}</span>
                  </td>
                  <td className={tdClass}>
                    <EventTypeBadge eventType={row.eventType} />
                  </td>
                  <td className={tdClass}>{formatBelongsToLabel(row.belongsTo)}</td>
                  <td className={tdWrapLong}>{row.districtName || "—"}</td>
                  <td className={tdWrapLong}>{row.departmentName || "—"}</td>
                  <td className={tdWrapLong}>{formatVenueLabel(row)}</td>
                  <td className={cn(tdClass, "text-right tabular-nums")}>
                    {formatAmountCell(row.previousYearAmount)}
                  </td>
                  <td className={cn(tdClass, "text-right tabular-nums")}>
                    {formatAmountCell(row.currentYearAmount)}
                  </td>
                  <td className={cn(tdClass, "text-right tabular-nums")}>
                    {row.eventType === EVENT_TYPES.MCA
                      ? formatAmountCell(row.mcaSurchargeAmount)
                      : "—"}
                  </td>
                  <td className={cn(tdClass, "text-right tabular-nums")}>
                    {row.gstRate != null ? `${row.gstRate}%` : "—"}
                  </td>
                  <td className={cn(tdClass, "text-right tabular-nums")}>
                    {formatAmountCell(row.gstAmount)}
                  </td>
                  <td className={cn(tdClass, "text-right font-medium tabular-nums text-zinc-900")}>
                    {formatAmountCell(row.finalAmount ?? row.grandTotal, {
                      amountsConfigured: row.amountsConfigured,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (stats?.totalEvents > 0 || events.length > 0) ? (
        <p className="mt-4 text-xs text-zinc-400">
          {stats?.totalEvents ?? events.length} event
          {(stats?.totalEvents ?? events.length) === 1 ? "" : "s"}
        </p>
      ) : null}
    </Drawer>
  );
}

export default BusinessPlanListDrawer;
