import { useEffect, useMemo, useState } from "react";
import { getDepartments } from "../../../api/department";
import { getDistricts } from "../../../api/district";
import { getBusinessPlanEvents } from "../../../api/buisnessplan";
import { getApiErrorMessage } from "../../../api/utils";
import Modal from "../../../components/common/Modal";
import PageHeader from "../../../components/common/PageHeader";
import SearchableSelect from "../../../components/common/SearchableSelect";
import {
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
} from "../../../utils/calendar";
import {
  groupEventsByDate,
  normalizeBusinessPlanEvent,
} from "../../../utils/businessPlanEvent";
import { getEntityId } from "../../../utils/entity";
import CalendarMonth from "./CalendarMonth";
import EventWizard from "./EventWizard";

function BusinessPlanCalendar() {
  const now = new Date();
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
  const [selectedDate, setSelectedDate] = useState("");
  const [editingEvent, setEditingEvent] = useState(null);

  const monthKey = formatMonthKey(year, monthIndex);
  const cells = useMemo(
    () => getCalendarCells(year, monthIndex),
    [year, monthIndex],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;

      setLoading(true);
      setError("");

      try {
        const params = {
          type: activeTab,
          month: monthKey,
        };
        if (filterDistrictId) params.districtId = filterDistrictId;
        if (filterDepartmentId) params.departmentId = filterDepartmentId;

        const list = await getBusinessPlanEvents(params);
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
  }, [activeTab, monthKey, filterDistrictId, filterDepartmentId]);

  const reloadEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { type: activeTab, month: monthKey };
      if (filterDistrictId) params.districtId = filterDistrictId;
      if (filterDepartmentId) params.departmentId = filterDepartmentId;
      const list = await getBusinessPlanEvents(params);
      setEvents(list.map(normalizeBusinessPlanEvent));
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

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const goPrev = () => {
    const next = shiftMonth(year, monthIndex, -1);
    setYear(next.year);
    setMonthIndex(next.monthIndex);
  };

  const goNext = () => {
    const next = shiftMonth(year, monthIndex, 1);
    setYear(next.year);
    setMonthIndex(next.monthIndex);
  };

  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonthIndex(t.getMonth());
  };

  const openCreate = (date) => {
    setEditingEvent(null);
    setSelectedDate(date);
    setModalOpen(true);
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setSelectedDate(event.date);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
    setSelectedDate("");
  };

  return (
    <article>
      <PageHeader
        title="Business Plan"
        description="Plan and track MCA, Tender, and Forgi events by month."
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="cursor-pointer rounded-full border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
            aria-label="Previous month"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="cursor-pointer rounded-full border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
            aria-label="Next month"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="min-w-[180px] text-lg font-semibold text-zinc-900">
            {getMonthLabel(year, monthIndex)}
          </h2>
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
      ) : (
        <CalendarMonth
          cells={cells}
          eventsByDate={eventsByDate}
          onDateClick={openCreate}
          onEventClick={openEdit}
        />
      )}

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
          key={editingEvent?.id ?? `new-${selectedDate}`}
          event={editingEvent}
          defaultDate={selectedDate}
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

export default BusinessPlanCalendar;
