import { useEffect, useMemo, useState } from "react";
import { getDepartments } from "../../../api/department";
import { getDistricts } from "../../../api/district";
import { getActualPlanEvents } from "../../../api/actualplan";
import { getApiErrorMessage } from "../../../api/utils";
import Modal from "../../../components/common/Modal";
import PageHeader from "../../../components/common/PageHeader";
import SearchableSelect from "../../../components/common/SearchableSelect";
import {
  CALENDAR_VIEW_MODES,
  CALENDAR_VIEW_OPTIONS,
  RECURRENCE_TYPES,
  EVENT_TYPE_OPTIONS,
  EVENT_TYPE_STYLES,
  PLAN_TAB_TYPES,
  PLAN_TABS,
} from "../../../constants/businessPlan";
import { cn } from "../../../utils/cn";
import {
  formatMonthKey,
  getCalendarCells,
  getMonthLabel,
  shiftMonth,
  shiftYear,
} from "../../../utils/calendar";
import {
  aggregateEventTypeStats,
  getUniqueEventsFromByDate,
  getUniqueEventsFromByMonth,
  groupEventsByDate,
  groupEventsByMonth,
  normalizeBusinessPlanEvent,
  resolveEventForCalendarYear,
} from "../../../utils/businessPlanEvent";
import { ActualPlanTypeStatsCards } from "./ActualPlanTypeStats";
import { getEntityId } from "../../../utils/entity";
import ActualPlanListDrawer from "./ActualPlanListDrawer";
import CalendarMonth from "./CalendarMonth";
import CalendarPeriodPicker from "./CalendarPeriodPicker";
import CalendarYear from "./CalendarYear";
import EventWizard from "./EventWizard";

function ActualPlanCalendar() {
  const now = new Date();
  const [viewMode, setViewMode] = useState(CALENDAR_VIEW_MODES.MONTH);
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [activeTab, setActiveTab] = useState(PLAN_TAB_TYPES.ALL);
  const [filterDistrictId, setFilterDistrictId] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [districts, setDistricts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [listDrawerOpen, setListDrawerOpen] = useState(false);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [editingEvent, setEditingEvent] = useState(null);
  const [wizardAmountYear, setWizardAmountYear] = useState(null);
  const [wizardInitialStepId, setWizardInitialStepId] = useState(null);

  const isYearView = viewMode === CALENDAR_VIEW_MODES.YEAR;
  const monthKey = formatMonthKey(year, monthIndex);
  const cells = useMemo(
    () => getCalendarCells(year, monthIndex),
    [year, monthIndex],
  );

  const fetchParams = useMemo(() => {
    const params = { type: activeTab };
    if (isYearView) {
      params.year = year;
    } else {
      params.month = monthKey;
    }
    if (filterDistrictId) params.districtId = filterDistrictId;
    if (filterDepartmentId) params.departmentId = filterDepartmentId;
    return params;
  }, [activeTab, isYearView, year, monthKey, filterDistrictId, filterDepartmentId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;

      setLoading(true);
      setError("");

      try {
        const list = await getActualPlanEvents(fetchParams);
        if (!cancelled) {
          setEvents(list.map(normalizeBusinessPlanEvent));
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Failed to load events."));
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [fetchParams]);

  const reloadEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getActualPlanEvents(fetchParams);
      setEvents(list.map(normalizeBusinessPlanEvent));
      setListRefreshKey((k) => k + 1);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load events."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingFilterOptions(true);
      try {
        const [d, dept] = await Promise.all([getDistricts(), getDepartments()]);
        if (active) {
          setDistricts(d);
          setDepartments(dept);
        }
      } catch {
        // filters optional
      } finally {
        if (active) setLoadingFilterOptions(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const eventsByDate = useMemo(
    () => groupEventsByDate(events, { year, monthIndex }),
    [events, year, monthIndex],
  );

  const eventsByMonth = useMemo(
    () => groupEventsByMonth(events, { year }),
    [events, year],
  );

  const periodTypeStats = useMemo(() => {
    if (isYearView) {
      return aggregateEventTypeStats(getUniqueEventsFromByMonth(eventsByMonth));
    }
    return aggregateEventTypeStats(getUniqueEventsFromByDate(eventsByDate));
  }, [isYearView, eventsByMonth, eventsByDate]);

  const statsTitle = isYearView
    ? `Statistics for ${year}`
    : `Statistics for ${getMonthLabel(year, monthIndex)}`;

  const goPrev = () => {
    if (isYearView) {
      setYear((y) => shiftYear(y, -1));
      return;
    }
    const next = shiftMonth(year, monthIndex, -1);
    setYear(next.year);
    setMonthIndex(next.monthIndex);
  };

  const goNext = () => {
    if (isYearView) {
      setYear((y) => shiftYear(y, 1));
      return;
    }
    const next = shiftMonth(year, monthIndex, 1);
    setYear(next.year);
    setMonthIndex(next.monthIndex);
  };

  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonthIndex(t.getMonth());
    setActiveTab(PLAN_TAB_TYPES.ALL);
    setFilterDistrictId("");
    setFilterDepartmentId("");
  };

  const openCreate = (date) => {
    setEditingEvent(null);
    setSelectedDate(date);
    const y = date ? Number(String(date).slice(0, 4)) : year;
    setWizardAmountYear(Number.isFinite(y) ? y : year);
    setWizardInitialStepId(null);
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    const normalized = normalizeBusinessPlanEvent(ev);
    const viewYear = year;
    const resolved = resolveEventForCalendarYear(normalized, viewYear);
    setEditingEvent(normalized);
    setSelectedDate(normalized.startDate ?? normalized.date);
    setWizardAmountYear(viewYear);
    setWizardInitialStepId(
      resolved.recurrenceType === RECURRENCE_TYPES.YEARLY && !resolved.amountsConfigured
        ? "amounts"
        : null,
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
    setSelectedDate("");
    setWizardAmountYear(null);
    setWizardInitialStepId(null);
  };

  const drillToMonth = (targetMonthIndex) => {
    setMonthIndex(targetMonthIndex);
    setViewMode(CALENDAR_VIEW_MODES.MONTH);
  };

  return (
    <article>
      <PageHeader
        title="Actual Plan"
        description="Plan and track MCA, Tender, and Forgi events by month or year."
        titleAddon={
          <button
            type="button"
            onClick={() => setListDrawerOpen(true)}
            className="cursor-pointer rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100"
          >
            List
          </button>
        }
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1 sm:max-w-xs">
            <SearchableSelect
              id="bp-filter-district"
              label="Filter district"
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
          <div className="min-w-[200px] flex-1 sm:max-w-xs">
            <SearchableSelect
              id="bp-filter-department"
              label="Filter department"
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
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50/80 p-1">
            {CALENDAR_VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setViewMode(opt.value)}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  viewMode === opt.value
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={goPrev}
            className="cursor-pointer rounded-full border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
            aria-label={isYearView ? "Previous year" : "Previous month"}
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="cursor-pointer rounded-full border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
            aria-label={isYearView ? "Next year" : "Next month"}
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <CalendarPeriodPicker
            viewMode={viewMode}
            year={year}
            monthIndex={monthIndex}
            onYearChange={setYear}
            onMonthChange={setMonthIndex}
          />
        </div>
        <button
          type="button"
          onClick={goToday}
          className="cursor-pointer rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Today
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-zinc-600">
        {EVENT_TYPE_OPTIONS.map((opt) => {
          const s = EVENT_TYPE_STYLES[opt.value];
          return (
            <span key={opt.value} className="inline-flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-full", s?.dot)} />
              {opt.label}
            </span>
          );
        })}
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-sm text-zinc-400">Loading calendar…</p>
      ) : isYearView ? (
        <CalendarYear
          year={year}
          eventsByMonth={eventsByMonth}
          onMonthClick={drillToMonth}
        />
      ) : (
        <CalendarMonth
          cells={cells}
          events={events}
          year={year}
          monthIndex={monthIndex}
          onDateClick={openCreate}
          onEventClick={openEdit}
        />
      )}

      {!loading ? (
        <ActualPlanTypeStatsCards stats={periodTypeStats} title={statsTitle} />
      ) : null}

      <ActualPlanListDrawer
        open={listDrawerOpen}
        onClose={() => setListDrawerOpen(false)}
        districts={districts}
        departments={departments}
        loadingFilterOptions={loadingFilterOptions}
        refreshKey={listRefreshKey}
        calendarYear={year}
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingEvent ? "Edit event" : "New event"}
        description={
          selectedDate
            ? `Date: ${new Date(selectedDate + "T12:00:00").toLocaleDateString()}`
            : undefined
        }
        size="lg"
      >
        <EventWizard
          key={editingEvent?.id ?? `new-${selectedDate}-${wizardAmountYear}`}
          event={editingEvent}
          defaultDate={selectedDate}
          defaultAmountYear={wizardAmountYear ?? year}
          initialStepId={wizardInitialStepId}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            reloadEvents();
          }}
        />
      </Modal>
    </article>
  );
}

export default ActualPlanCalendar;
