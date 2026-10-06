import { WEEKDAYS } from "../../../utils/calendar";
import { cn } from "../../../utils/cn";
import TodoEventChip from "./TodoEventChip";

function TodoMonthView({ cells, todosByDate, selectedDate, onDateClick, onTodoClick }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm shadow-zinc-900/[0.02]">
      <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/80">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dayTodos = todosByDate[cell.date] ?? [];
          const isSelected = selectedDate === cell.date;

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onDateClick(cell.date)}
              className={cn(
                "min-h-[108px] cursor-pointer border-b border-r border-zinc-100 p-1.5 text-left transition-colors sm:min-h-[120px]",
                "hover:bg-zinc-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400/50",
                !cell.inCurrentMonth && "bg-zinc-50/40 text-zinc-400",
                isSelected && "bg-sky-50/70",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-xs font-medium",
                  cell.isToday && cell.inCurrentMonth && "bg-sky-600 text-white",
                  isSelected && !cell.isToday && "bg-zinc-900 text-white",
                )}
              >
                {cell.day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayTodos.slice(0, 3).map((todo) => (
                  <TodoEventChip
                    key={todo.id}
                    todo={todo}
                    onSelect={onTodoClick}
                    compact
                  />
                ))}
                {dayTodos.length > 3 ? (
                  <span className="block px-1 text-[10px] font-medium text-zinc-500">
                    +{dayTodos.length - 3} more
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default TodoMonthView;
