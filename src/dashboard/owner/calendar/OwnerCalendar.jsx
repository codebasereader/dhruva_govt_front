import { useEffect, useMemo, useState } from "react";
import { getTodos } from "../../../api/todo";
import { getApiErrorMessage } from "../../../api/utils";
import Modal from "../../../components/common/Modal";
import PageHeader from "../../../components/common/PageHeader";
import { CALENDAR_VIEW_MODES } from "../../../constants/businessPlan";
import {
  formatMonthKey,
  getCalendarCells,
  shiftMonth,
  toDateString,
} from "../../../utils/calendar";
import { formatLongDate, groupTodosByDate, normalizeTodo } from "../../../utils/todo";
import CalendarPeriodPicker from "../actualplan/CalendarPeriodPicker";
import DayTodosPanel from "./DayTodosPanel";
import TodoForm from "./TodoForm";
import TodoMonthGrid from "./TodoMonthGrid";

function OwnerCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [editingTodo, setEditingTodo] = useState(null);
  const [dayPanelDate, setDayPanelDate] = useState("");

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
        const list = await getTodos({ month: monthKey });
        if (!cancelled) {
          setTodos(list.map(normalizeTodo).filter(Boolean));
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Failed to load todos."));
          setTodos([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  const reloadTodos = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getTodos({ month: monthKey });
      setTodos(list.map(normalizeTodo).filter(Boolean));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load todos."));
    } finally {
      setLoading(false);
    }
  };

  const todosByDate = useMemo(() => groupTodosByDate(todos), [todos]);

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
    const today = new Date();
    setYear(today.getFullYear());
    setMonthIndex(today.getMonth());
  };

  const openCreate = (date) => {
    setEditingTodo(null);
    setSelectedDate(date);
    setDayPanelDate("");
    setFormOpen(true);
  };

  const openEdit = (todo) => {
    setEditingTodo(todo);
    setSelectedDate(todo.date);
    setDayPanelDate("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTodo(null);
    setSelectedDate("");
  };

  const handleSaved = async () => {
    closeForm();
    await reloadTodos();
  };

  const openCreateFromHeader = () => {
    const today = new Date();
    const viewingCurrentMonth =
      today.getFullYear() === year && today.getMonth() === monthIndex;
    openCreate(
      viewingCurrentMonth
        ? toDateString(today)
        : toDateString(new Date(year, monthIndex, 1)),
    );
  };

  return (
    <article>
      <PageHeader
        title="Calendar"
        description="Month view of your todos. Click a day to add one with a time, like Google Calendar."
      >
        <button
          type="button"
          onClick={openCreateFromHeader}
          className="cursor-pointer rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Create
        </button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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

          <CalendarPeriodPicker
            viewMode={CALENDAR_VIEW_MODES.MONTH}
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

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-sm text-zinc-400">Loading calendar…</p>
      ) : (
        <TodoMonthGrid
          cells={cells}
          todosByDate={todosByDate}
          onDateClick={openCreate}
          onTodoClick={openEdit}
          onMoreClick={setDayPanelDate}
        />
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingTodo ? "Edit todo" : "New todo"}
        description={
          selectedDate
            ? formatLongDate(selectedDate)
            : undefined
        }
        size="md"
      >
        <TodoForm
          key={editingTodo?.id ?? `new-${selectedDate}`}
          todo={editingTodo}
          defaultDate={selectedDate}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      </Modal>

      <Modal
        open={Boolean(dayPanelDate) && !formOpen}
        onClose={() => setDayPanelDate("")}
        title="Todos"
        size="sm"
      >
        <DayTodosPanel
          date={dayPanelDate}
          todos={todosByDate[dayPanelDate] ?? []}
          onAdd={() => openCreate(dayPanelDate)}
          onSelect={openEdit}
          onClose={() => setDayPanelDate("")}
        />
      </Modal>
    </article>
  );
}

export default OwnerCalendar;
