import { useEffect, useState } from "react";
import FormField from "../../../components/common/FormField";
import Modal from "../../../components/common/Modal";
import {
  DEFAULT_TODO_COLOR,
  TODO_COLOR_OPTIONS,
} from "../../../constants/calendarTodo";
import { cn } from "../../../utils/cn";
import {
  addHourToTime,
  formatLongDate,
  getDefaultStartTime,
} from "../../../utils/calendarTodo";

const emptyForm = (date) => ({
  title: "",
  notes: "",
  date: date || "",
  startTime: getDefaultStartTime(),
  endTime: addHourToTime(getDefaultStartTime(), 1),
  allDay: false,
  color: DEFAULT_TODO_COLOR,
  completed: false,
});

function TodoFormModal({
  open,
  onClose,
  onSave,
  onDelete,
  initialTodo,
  defaultDate,
  saving,
}) {
  const isEdit = Boolean(initialTodo?.id);
  const [form, setForm] = useState(() => emptyForm(defaultDate));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (initialTodo) {
      setForm({
        title: initialTodo.title ?? "",
        notes: initialTodo.notes ?? "",
        date: initialTodo.date ?? defaultDate ?? "",
        startTime: initialTodo.startTime || getDefaultStartTime(),
        endTime:
          initialTodo.endTime ||
          addHourToTime(initialTodo.startTime || getDefaultStartTime(), 1),
        allDay: Boolean(initialTodo.allDay),
        color: initialTodo.color || DEFAULT_TODO_COLOR,
        completed: Boolean(initialTodo.completed),
      });
    } else {
      setForm(emptyForm(defaultDate));
    }
  }, [open, initialTodo, defaultDate]);

  const setField = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "startTime" && !prev.allDay) {
        const end = addHourToTime(value, 1);
        if (!prev.endTime || prev.endTime <= value) {
          next.endTime = end;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.date) {
      setError("Pick a date.");
      return;
    }
    if (!form.allDay) {
      if (!form.startTime || !form.endTime) {
        setError("Start and end time are required.");
        return;
      }
      if (form.endTime <= form.startTime) {
        setError("End time must be after start time.");
        return;
      }
    }

    try {
      await onSave({
        title: form.title.trim(),
        notes: form.notes.trim(),
        date: form.date,
        allDay: form.allDay,
        startTime: form.allDay ? null : form.startTime,
        endTime: form.allDay ? null : form.endTime,
        color: form.color,
        completed: form.completed,
      });
    } catch (err) {
      setError(err?.message || "Could not save todo.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit todo" : "New todo"}
      description={form.date ? formatLongDate(form.date) : undefined}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          id="todo-title"
          label="Title"
          value={form.title}
          onChange={setField("title")}
          placeholder="Add title"
          required
        />

        {isEdit ? (
          <div className="flex items-center gap-3">
            <input
              id="todo-completed"
              type="checkbox"
              checked={form.completed}
              onChange={setField("completed")}
              className="size-4 cursor-pointer rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
            />
            <label htmlFor="todo-completed" className="cursor-pointer text-sm text-zinc-700">
              Mark as completed
            </label>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <input
            id="todo-all-day"
            type="checkbox"
            checked={form.allDay}
            onChange={setField("allDay")}
            className="size-4 cursor-pointer rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
          />
          <label htmlFor="todo-all-day" className="cursor-pointer text-sm text-zinc-700">
            All day
          </label>
        </div>

        <FormField
          id="todo-date"
          label="Date"
          type="date"
          value={form.date}
          onChange={setField("date")}
          required
        />

        {!form.allDay ? (
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="todo-start"
              label="Start time"
              type="time"
              value={form.startTime}
              onChange={setField("startTime")}
              required
            />
            <FormField
              id="todo-end"
              label="End time"
              type="time"
              value={form.endTime}
              onChange={setField("endTime")}
              required
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Colour
          </span>
          <div className="flex flex-wrap gap-2">
            {TODO_COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={form.color === opt.value}
                onClick={() => setForm((prev) => ({ ...prev, color: opt.value }))}
                className={cn(
                  "size-7 cursor-pointer rounded-full transition-transform",
                  opt.solid,
                  form.color === opt.value
                    ? "ring-2 ring-zinc-900 ring-offset-2 scale-110"
                    : "hover:scale-105",
                )}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="todo-notes"
            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Notes
          </label>
          <textarea
            id="todo-notes"
            value={form.notes}
            onChange={setField("notes")}
            rows={3}
            placeholder="Add details"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-400/40"
          />
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {isEdit ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default TodoFormModal;
