import { DAY_HOURS, TODO_COLOR_MAP } from "../../../constants/calendarTodo";
import { cn } from "../../../utils/cn";
import {
  formatTimeLabel,
  parseDateString,
  timeToMinutes,
} from "../../../utils/calendarTodo";

const HOUR_HEIGHT = 56;

function TodoWeekView({
  weekDates,
  todosByDate,
  selectedDate,
  onDateClick,
  onSlotClick,
  onTodoClick,
}) {
  const allDayRow = weekDates.some((d) =>
    (todosByDate[d] ?? []).some((t) => t.allDay),
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm shadow-zinc-900/[0.02]">
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-zinc-100 bg-zinc-50/80">
        <div className="border-r border-zinc-100" />
        {weekDates.map((dateStr) => {
          const d = parseDateString(dateStr);
          const isToday =
            dateStr ===
            `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onDateClick(dateStr)}
              className={cn(
                "cursor-pointer border-r border-zinc-100 px-1 py-3 text-center last:border-r-0",
                "hover:bg-zinc-100/80",
                isSelected && "bg-sky-50",
              )}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {d.toLocaleDateString("default", { weekday: "short" })}
              </div>
              <div
                className={cn(
                  "mx-auto mt-1 flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                  isToday && "bg-sky-600 text-white",
                  isSelected && !isToday && "bg-zinc-900 text-white",
                  !isToday && !isSelected && "text-zinc-800",
                )}
              >
                {d.getDate()}
              </div>
            </button>
          );
        })}
      </div>

      {allDayRow ? (
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-zinc-100">
          <div className="flex items-start justify-end border-r border-zinc-100 px-1 pt-2 text-[10px] font-medium text-zinc-400">
            All day
          </div>
          {weekDates.map((dateStr) => {
            const allDayTodos = (todosByDate[dateStr] ?? []).filter((t) => t.allDay);
            return (
              <div
                key={`allday-${dateStr}`}
                className="min-h-[40px] space-y-0.5 border-r border-zinc-100 p-1 last:border-r-0"
              >
                {allDayTodos.map((todo) => {
                  const style = TODO_COLOR_MAP[todo.color] ?? TODO_COLOR_MAP.blue;
                  return (
                    <button
                      key={todo.id}
                      type="button"
                      onClick={() => onTodoClick(todo)}
                      className={cn(
                        "w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-semibold",
                        style.bg,
                        style.text,
                      )}
                    >
                      {todo.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="max-h-[min(68vh,720px)] overflow-y-auto">
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          <div className="relative border-r border-zinc-100">
            {DAY_HOURS.map((hour) => (
              <div
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="relative border-b border-zinc-50 pr-1 text-right"
              >
                <span className="-mt-2 block text-[10px] font-medium text-zinc-400">
                  {hour === 0 ? "" : formatHourShort(hour)}
                </span>
              </div>
            ))}
          </div>

          {weekDates.map((dateStr) => {
            const timed = (todosByDate[dateStr] ?? []).filter((t) => !t.allDay);
            return (
              <div
                key={`col-${dateStr}`}
                className="relative border-r border-zinc-100 last:border-r-0"
                style={{ height: DAY_HOURS.length * HOUR_HEIGHT }}
              >
                {DAY_HOURS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    aria-label={`Add todo at ${formatHourShort(hour)} on ${dateStr}`}
                    onClick={() =>
                      onSlotClick(dateStr, `${String(hour).padStart(2, "0")}:00`)
                    }
                    className="absolute left-0 right-0 w-full cursor-pointer border-b border-zinc-50 hover:bg-sky-50/40"
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  />
                ))}

                {timed.map((todo) => {
                  const start = timeToMinutes(todo.startTime);
                  const end = todo.endTime
                    ? timeToMinutes(todo.endTime)
                    : start + 60;
                  const top = (start / 60) * HOUR_HEIGHT;
                  const height = Math.max(((end - start) / 60) * HOUR_HEIGHT, 22);
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
                        "absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-md border px-1.5 py-0.5 text-left shadow-sm",
                        "cursor-pointer hover:brightness-95",
                        style.bg,
                        style.text,
                        style.border,
                      )}
                    >
                      <span className="block truncate text-[10px] font-semibold leading-tight">
                        {todo.title}
                      </span>
                      <span className="block truncate text-[9px] opacity-80">
                        {formatTimeLabel(todo.startTime)}
                        {todo.endTime ? ` – ${formatTimeLabel(todo.endTime)}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function formatHourShort(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h} ${suffix}`;
}

export default TodoWeekView;
