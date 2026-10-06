import { DAY_HOURS, TODO_COLOR_MAP } from "../../../constants/calendarTodo";
import { cn } from "../../../utils/cn";
import {
  formatLongDate,
  formatTimeLabel,
  timeToMinutes,
} from "../../../utils/calendarTodo";

const HOUR_HEIGHT = 64;

function formatHourShort(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h} ${suffix}`;
}

function TodoDayView({ date, todos, onSlotClick, onTodoClick }) {
  const allDay = todos.filter((t) => t.allDay);
  const timed = todos.filter((t) => !t.allDay);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm shadow-zinc-900/[0.02]">
      <div className="border-b border-zinc-100 bg-zinc-50/80 px-5 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">{formatLongDate(date)}</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          {todos.length === 0
            ? "No todos — click a time slot to add one"
            : `${todos.length} todo${todos.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {allDay.length > 0 ? (
        <div className="space-y-1 border-b border-zinc-100 px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            All day
          </p>
          {allDay.map((todo) => {
            const style = TODO_COLOR_MAP[todo.color] ?? TODO_COLOR_MAP.blue;
            return (
              <button
                key={todo.id}
                type="button"
                onClick={() => onTodoClick(todo)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left",
                  style.bg,
                  style.text,
                  style.border,
                )}
              >
                <span className={cn("size-2.5 shrink-0 rounded-full", style.solid)} />
                <span className="font-semibold">{todo.title}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="max-h-[min(70vh,760px)] overflow-y-auto">
        <div className="relative grid grid-cols-[64px_1fr]">
          <div className="border-r border-zinc-100">
            {DAY_HOURS.map((hour) => (
              <div
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="relative border-b border-zinc-50 pr-2 text-right"
              >
                <span className="-mt-2 block text-[11px] font-medium text-zinc-400">
                  {hour === 0 ? "" : formatHourShort(hour)}
                </span>
              </div>
            ))}
          </div>

          <div
            className="relative"
            style={{ height: DAY_HOURS.length * HOUR_HEIGHT }}
          >
            {DAY_HOURS.map((hour) => (
              <button
                key={hour}
                type="button"
                aria-label={`Add todo at ${formatHourShort(hour)}`}
                onClick={() =>
                  onSlotClick(date, `${String(hour).padStart(2, "0")}:00`)
                }
                className="absolute left-0 right-0 w-full cursor-pointer border-b border-zinc-50 hover:bg-sky-50/50"
                style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              />
            ))}

            {timed.map((todo) => {
              const start = timeToMinutes(todo.startTime);
              const end = todo.endTime ? timeToMinutes(todo.endTime) : start + 60;
              const top = (start / 60) * HOUR_HEIGHT;
              const height = Math.max(((end - start) / 60) * HOUR_HEIGHT, 28);
              const style = TODO_COLOR_MAP[todo.color] ?? TODO_COLOR_MAP.blue;

              return (
                <button
                  key={todo.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTodoClick(todo);
                  }}
                  style={{ top, height }}
                  className={cn(
                    "absolute left-2 right-2 z-10 overflow-hidden rounded-lg border px-3 py-1.5 text-left shadow-sm",
                    "cursor-pointer hover:brightness-95",
                    style.bg,
                    style.text,
                    style.border,
                  )}
                >
                  <span className="block truncate text-sm font-semibold">{todo.title}</span>
                  <span className="block text-xs opacity-80">
                    {formatTimeLabel(todo.startTime)}
                    {todo.endTime ? ` – ${formatTimeLabel(todo.endTime)}` : ""}
                  </span>
                  {todo.notes && height > 48 ? (
                    <span className="mt-0.5 block truncate text-xs opacity-70">
                      {todo.notes}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TodoDayView;
