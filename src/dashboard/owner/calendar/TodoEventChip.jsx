import { TODO_COLOR_MAP } from "../../../constants/calendarTodo";
import { cn } from "../../../utils/cn";
import { formatTimeLabel } from "../../../utils/calendarTodo";

function TodoEventChip({ todo, onSelect, compact = false }) {
  const style = TODO_COLOR_MAP[todo.color] ?? TODO_COLOR_MAP.blue;
  const timePart = todo.allDay
    ? "All day"
    : formatTimeLabel(todo.startTime);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(todo);
      }}
      title={[todo.title, timePart, todo.notes].filter(Boolean).join(" · ")}
      className={cn(
        "w-full cursor-pointer rounded px-1.5 text-left transition-opacity hover:opacity-90",
        "border",
        style.bg,
        style.text,
        style.border,
        compact ? "py-0.5 text-[10px] leading-tight" : "py-1 text-[11px] leading-snug",
        todo.completed && "opacity-60",
      )}
    >
      <span
        className={cn(
          "block truncate font-semibold",
          todo.completed && "line-through",
        )}
      >
        {!todo.allDay && compact ? (
          <>
            <span className="font-medium opacity-80">{timePart}</span>
            {" "}
            {todo.title}
          </>
        ) : (
          todo.title
        )}
      </span>
      {!compact ? (
        <span className="mt-0.5 block truncate opacity-80">{timePart}</span>
      ) : null}
    </button>
  );
}

export default TodoEventChip;
