import { MAX_TODOS_VISIBLE_PER_DAY, TODO_COLOR_MAP } from "../../../constants/todo";
import { cn } from "../../../utils/cn";
import { WEEKDAYS } from "../../../utils/calendar";
import { formatTimeLabel } from "../../../utils/todo";

function TodoChip({ todo, onSelect }) {
  const color = TODO_COLOR_MAP[todo.color] ?? TODO_COLOR_MAP.blue;
  const time = todo.allDay ? "" : formatTimeLabel(todo.startTime);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect(todo);
      }}
      title={[time, todo.title].filter(Boolean).join(" · ")}
      className={cn(
        "flex w-full min-w-0 cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] leading-tight",
        "hover:brightness-95",
        todo.allDay ? cn(color.bg, color.text) : "text-zinc-700 hover:bg-zinc-100",
        todo.completed && "opacity-60",
      )}
    >
      {!todo.allDay ? (
        <span className={cn("mt-px size-1.5 shrink-0 rounded-full", color.dot)} />
      ) : null}
      {time ? (
        <span className="shrink-0 tabular-nums text-zinc-500">{time}</span>
      ) : null}
      <span
        className={cn(
          "min-w-0 truncate font-medium",
          todo.completed && "line-through",
        )}
      >
        {todo.title}
      </span>
    </button>
  );
}

function TodoMonthGrid({
  cells,
  todosByDate,
  onDateClick,
  onTodoClick,
  onMoreClick,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm shadow-zinc-900/[0.02]">
      <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/80">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dayTodos = todosByDate[cell.date] ?? [];
          const visible = dayTodos.slice(0, MAX_TODOS_VISIBLE_PER_DAY);
          const hiddenCount = dayTodos.length - visible.length;

          return (
            <div
              key={cell.date}
              onClick={() => onDateClick(cell.date)}
              className={cn(
                "min-h-[118px] cursor-pointer border-b border-r border-zinc-100 p-1.5 text-left transition-colors [&:nth-child(7n)]:border-r-0",
                "hover:bg-zinc-50/90",
                !cell.inCurrentMonth && "bg-zinc-50/50 text-zinc-400",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full text-xs font-medium",
                    cell.isToday && cell.inCurrentMonth && "bg-zinc-900 text-white",
                    !cell.inCurrentMonth && "text-zinc-400",
                  )}
                >
                  {cell.day}
                </span>
              </div>

              <div className="space-y-0.5">
                {visible.map((todo) => (
                  <TodoChip key={todo.id || `${todo.date}-${todo.title}`} todo={todo} onSelect={onTodoClick} />
                ))}
                {hiddenCount > 0 ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoreClick(cell.date);
                    }}
                    className="w-full cursor-pointer rounded px-1 py-0.5 text-left text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    +{hiddenCount} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TodoMonthGrid;
