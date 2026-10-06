import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCalendarTodo,
  deleteCalendarTodo,
  getCalendarTodos,
  updateCalendarTodo,
} from "../../../api/calendarTodos";
import { getApiErrorMessage } from "../../../api/utils";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import PageHeader from "../../../components/common/PageHeader";
import {
  CALENDAR_TODO_VIEW_MODES,
  CALENDAR_TODO_VIEW_OPTIONS,
} from "../../../constants/calendarTodo";
import { cn } from "../../../utils/cn";
import {
  formatMonthKey,
  getCalendarCells,
  getMonthLabel,
  shiftMonth,
  toDateString,
} from "../../../utils/calendar";
import {
  addHourToTime,
  formatLongDate,
  getWeekDates,
  groupTodosByDate,
  parseDateString,
  shiftDays,
} from "../../../utils/calendarTodo";
import TodoDayView from "./TodoDayView";
import TodoFormModal from "./TodoFormModal";
import TodoMonthView from "./TodoMonthView";
import TodoWeekView from "./TodoWeekView";

function uniqueById(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function TodoCalendar() {
  const today = toDateString(new Date());

  const [viewMode, setViewMode] = useState(CALENDAR_TODO_VIEW_MODES.MONTH);
  const [focusDate, setFocusDate] = useState(today);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [draftDefaults, setDraftDefaults] = useState({ date: today, startTime: null });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const focus = useMemo(() => {
    const [y, m, d] = focusDate.split("-").map(Number);
    return { year: y, monthIndex: m - 1, day: d, date: focusDate };
  }, [focusDate]);

  const weekDates = useMemo(() => getWeekDates(focusDate), [focusDate]);

  const monthKey = useMemo(
    () => formatMonthKey(focus.year, focus.monthIndex),
    [focus.year, focus.monthIndex],
  );

  const loadTodos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let list;

      if (viewMode === CALENDAR_TODO_VIEW_MODES.DAY) {
        list = await getCalendarTodos({ date: focusDate });
      } else if (viewMode === CALENDAR_TODO_VIEW_MODES.WEEK) {
        const months = [
          ...new Set(weekDates.map((d) => d.slice(0, 7))),
        ];
        const batches = await Promise.all(
          months.map((month) => getCalendarTodos({ month })),
        );
        list = uniqueById(batches.flat()).filter(
          (t) => t.date >= weekDates[0] && t.date <= weekDates[6],
        );
      } else {
        list = await getCalendarTodos({ month: monthKey });
      }

      setTodos(list);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load todos."));
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, focusDate, monthKey, weekDates]);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const todosByDate = useMemo(() => groupTodosByDate(todos), [todos]);
  const dayTodos = todosByDate[focusDate] ?? [];

  const cells = useMemo(
    () => getCalendarCells(focus.year, focus.monthIndex),
    [focus.year, focus.monthIndex],
  );

  const periodLabel = useMemo(() => {
    if (viewMode === CALENDAR_TODO_VIEW_MODES.MONTH) {
      return getMonthLabel(focus.year, focus.monthIndex);
    }
    if (viewMode === CALENDAR_TODO_VIEW_MODES.WEEK) {
      const start = parseDateString(weekDates[0]);
      const end = parseDateString(weekDates[6]);
      const left = start.toLocaleDateString("default", {
        month: "short",
        day: "numeric",
      });
      const right =
        start.getMonth() === end.getMonth()
          ? end.toLocaleDateString("default", { day: "numeric", year: "numeric" })
          : end.toLocaleDateString("default", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
      return `${left} – ${right}`;
    }
    return formatLongDate(focusDate);
  }, [viewMode, focus, weekDates, focusDate]);

  const openCreate = (date, startTime = null) => {
    setEditingTodo(null);
    setDraftDefaults({
      date,
      startTime,
    });
    setModalOpen(true);
  };

  const openEdit = (todo) => {
    setEditingTodo(todo);
    setDraftDefaults({ date: todo.date, startTime: todo.startTime });
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editingTodo?.id) {
        await updateCalendarTodo(editingTodo.id, payload);
      } else {
        await createCalendarTodo(payload);
      }
      setModalOpen(false);
      setEditingTodo(null);
      await loadTodos();
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Could not save todo."));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deleteCalendarTodo(deleteTarget.id);
      setDeleteTarget(null);
      setModalOpen(false);
      setEditingTodo(null);
      await loadTodos();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete todo."));
    } finally {
      setDeleting(false);
    }
  };

  const goToday = () => setFocusDate(today);

  const goPrev = () => {
    if (viewMode === CALENDAR_TODO_VIEW_MODES.MONTH) {
      const next = shiftMonth(focus.year, focus.monthIndex, -1);
      setFocusDate(
        `${next.year}-${String(next.monthIndex + 1).padStart(2, "0")}-01`,
      );
      return;
    }
    if (viewMode === CALENDAR_TODO_VIEW_MODES.WEEK) {
      setFocusDate(shiftDays(focusDate, -7));
      return;
    }
    setFocusDate(shiftDays(focusDate, -1));
  };

  const goNext = () => {
    if (viewMode === CALENDAR_TODO_VIEW_MODES.MONTH) {
      const next = shiftMonth(focus.year, focus.monthIndex, 1);
      setFocusDate(
        `${next.year}-${String(next.monthIndex + 1).padStart(2, "0")}-01`,
      );
      return;
    }
    if (viewMode === CALENDAR_TODO_VIEW_MODES.WEEK) {
      setFocusDate(shiftDays(focusDate, 7));
      return;
    }
    setFocusDate(shiftDays(focusDate, 1));
  };

  const handleSlotClick = (date, startTime) => {
    setFocusDate(date);
    openCreate(date, startTime);
  };

  const modalInitial = useMemo(() => {
    if (editingTodo) return editingTodo;
    if (!draftDefaults.startTime) {
      return null;
    }
    return {
      date: draftDefaults.date,
      startTime: draftDefaults.startTime,
      endTime: addHourToTime(draftDefaults.startTime, 1),
      allDay: false,
      title: "",
      notes: "",
      completed: false,
    };
  }, [editingTodo, draftDefaults]);

  return (
    <article>
      <PageHeader
        title="Calendar"
        description="Plan your day like Google Calendar — multiple timed todos per date."
      >
        <button
          type="button"
          onClick={() => openCreate(focusDate)}
          className="cursor-pointer rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Create
        </button>
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="cursor-pointer rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Today
          </button>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous"
              className="cursor-pointer rounded-full p-2 text-zinc-600 hover:bg-zinc-100"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next"
              className="cursor-pointer rounded-full p-2 text-zinc-600 hover:bg-zinc-100"
            >
              ›
            </button>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">
            {periodLabel}
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Calendar view"
          className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-0.5"
        >
          {CALENDAR_TODO_VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={viewMode === opt.value}
              onClick={() => setViewMode(opt.value)}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                viewMode === opt.value
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500">
          Loading calendar…
        </div>
      ) : null}

      {!loading && viewMode === CALENDAR_TODO_VIEW_MODES.MONTH ? (
        <TodoMonthView
          cells={cells}
          todosByDate={todosByDate}
          selectedDate={focusDate}
          onDateClick={(date) => {
            setFocusDate(date);
            openCreate(date);
          }}
          onTodoClick={openEdit}
        />
      ) : null}

      {!loading && viewMode === CALENDAR_TODO_VIEW_MODES.WEEK ? (
        <TodoWeekView
          weekDates={weekDates}
          todosByDate={todosByDate}
          selectedDate={focusDate}
          onDateClick={setFocusDate}
          onSlotClick={handleSlotClick}
          onTodoClick={openEdit}
        />
      ) : null}

      {!loading && viewMode === CALENDAR_TODO_VIEW_MODES.DAY ? (
        <TodoDayView
          date={focusDate}
          todos={dayTodos}
          onSlotClick={handleSlotClick}
          onTodoClick={openEdit}
        />
      ) : null}

      <TodoFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTodo(null);
        }}
        onSave={handleSave}
        onDelete={() => setDeleteTarget(editingTodo)}
        initialTodo={modalInitial}
        defaultDate={draftDefaults.date || focusDate}
        saving={saving}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete todo?"
        message={`“${deleteTarget?.title ?? ""}” will be removed from your calendar.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </article>
  );
}

export default TodoCalendar;
