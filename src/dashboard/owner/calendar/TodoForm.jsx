import { useState } from "react";
import {
  createTodo,
  deleteTodo,
  updateTodo,
} from "../../../api/todo";
import { getApiErrorMessage } from "../../../api/utils";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import FormField from "../../../components/common/FormField";
import { TODO_COLOR_DEFAULT, TODO_COLORS } from "../../../constants/todo";
import { cn } from "../../../utils/cn";
import {
  buildTodoPayload,
  compareTimes,
  formatTimeLabel,
  getDefaultTimesForDate,
  getTimeOptions,
  isValidDateString,
  isValidTimeString,
} from "../../../utils/todo";

const btnPrimary =
  "cursor-pointer rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50";
const btnSecondary =
  "cursor-pointer rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50";
const btnDanger =
  "cursor-pointer rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50";

const TIME_OPTIONS = getTimeOptions(15);

function timeSelectOptions(value) {
  if (!value || TIME_OPTIONS.some((option) => option.value === value)) {
    return TIME_OPTIONS;
  }
  return [{ value, label: formatTimeLabel(value) }, ...TIME_OPTIONS];
}

function emptyForm(date) {
  const times = getDefaultTimesForDate(date);
  return {
    title: "",
    date: date ?? "",
    allDay: false,
    startTime: times.startTime,
    endTime: times.endTime,
    notes: "",
    color: TODO_COLOR_DEFAULT,
    completed: false,
  };
}

function formFromTodo(todo) {
  return {
    title: todo.title ?? "",
    date: todo.date ?? "",
    allDay: Boolean(todo.allDay),
    startTime: todo.startTime || "09:00",
    endTime: todo.endTime || "10:00",
    notes: todo.notes ?? "",
    color: todo.color || TODO_COLOR_DEFAULT,
    completed: Boolean(todo.completed),
  };
}

function validateForm(form) {
  if (!form.title.trim()) return "Title is required.";
  if (form.title.trim().length > 200) return "Title must be 200 characters or less.";
  if (!isValidDateString(form.date)) return "Choose a valid date.";
  if (!form.allDay) {
    if (!isValidTimeString(form.startTime) || !isValidTimeString(form.endTime)) {
      return "Choose a start and end time.";
    }
    if (compareTimes(form.endTime, form.startTime) <= 0) {
      return "End time must be after start time.";
    }
  }
  if (form.notes.length > 2000) return "Notes must be 2000 characters or less.";
  return "";
}

function TodoForm({ todo, defaultDate, onClose, onSaved }) {
  const isEdit = Boolean(todo?.id);
  const [form, setForm] = useState(() =>
    todo ? formFromTodo(todo) : emptyForm(defaultDate),
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (nextDate) => {
    setForm((prev) => {
      if (prev.allDay || isEdit) {
        return { ...prev, date: nextDate };
      }
      const times = getDefaultTimesForDate(nextDate);
      return { ...prev, date: nextDate, startTime: times.startTime, endTime: times.endTime };
    });
  };

  const handleAllDayChange = (checked) => {
    setForm((prev) => {
      if (checked) {
        return { ...prev, allDay: true };
      }
      const times = getDefaultTimesForDate(prev.date);
      return {
        ...prev,
        allDay: false,
        startTime: prev.startTime || times.startTime,
        endTime: prev.endTime || times.endTime,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const payload = buildTodoPayload(form);
      if (isEdit) {
        await updateTodo(todo.id, payload);
      } else {
        await createTodo(payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save todo."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!todo?.id) return;
    setDeleting(true);
    try {
      await deleteTodo(todo.id);
      setConfirmDelete(false);
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete todo."));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const busy = submitting || deleting;

  return (
    <>
      <form className="flex flex-col" onSubmit={handleSubmit}>
        <div className="space-y-5">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <FormField
            id="todo-title"
            label="Title"
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            placeholder="Add title"
            required
            disabled={busy}
            autoFocus
          />

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(event) => handleAllDayChange(event.target.checked)}
              disabled={busy}
              className="size-4 rounded border-zinc-300 text-zinc-900"
            />
            All day
          </label>

          <FormField
            id="todo-date"
            label="Date"
            type="date"
            value={form.date}
            onChange={(event) => handleDateChange(event.target.value)}
            required
            disabled={busy}
          />

          {!form.allDay ? (
            <div className="grid grid-cols-2 gap-3">
              <FormField
                id="todo-start-time"
                label="Start time"
                as="select"
                value={form.startTime}
                onChange={(event) => setField("startTime", event.target.value)}
                options={timeSelectOptions(form.startTime)}
                required
                disabled={busy}
              />
              <FormField
                id="todo-end-time"
                label="End time"
                as="select"
                value={form.endTime}
                onChange={(event) => setField("endTime", event.target.value)}
                options={timeSelectOptions(form.endTime)}
                required
                disabled={busy}
              />
            </div>
          ) : null}

          <FormField
            id="todo-notes"
            label="Notes"
            as="textarea"
            value={form.notes}
            onChange={(event) => setField("notes", event.target.value)}
            placeholder="Add description"
            disabled={busy}
            rows={3}
          />

          <fieldset>
            <legend className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Color
            </legend>
            <div className="flex flex-wrap gap-2">
              {TODO_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  aria-label={color.label}
                  aria-pressed={form.color === color.value}
                  onClick={() => setField("color", color.value)}
                  disabled={busy}
                  className={cn(
                    "size-7 cursor-pointer rounded-full",
                    color.bar,
                    form.color === color.value
                      ? "ring-2 ring-zinc-900 ring-offset-2"
                      : "hover:scale-105",
                  )}
                />
              ))}
            </div>
          </fieldset>

          {isEdit ? (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={form.completed}
                onChange={(event) => setField("completed", event.target.checked)}
                disabled={busy}
                className="size-4 rounded border-zinc-300 text-zinc-900"
              />
              Mark as completed
            </label>
          ) : null}
        </div>

        <footer className="mt-8 flex flex-wrap gap-3 border-t border-zinc-100 pt-6">
          {isEdit ? (
            <button
              type="button"
              className={btnDanger}
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
            >
              Delete
            </button>
          ) : null}
          <div className="ml-auto flex gap-3">
            <button
              type="button"
              className={btnSecondary}
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={busy}>
              {submitting ? "Saving…" : isEdit ? "Save" : "Create"}
            </button>
          </div>
        </footer>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete todo"
        message="This todo will be removed from the calendar. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </>
  );
}

export default TodoForm;
