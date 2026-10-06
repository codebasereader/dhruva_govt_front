import { TODO_COLOR_MAP } from "../../../constants/todo";
import { cn } from "../../../utils/cn";
import { formatLongDate, formatTodoTimeRange } from "../../../utils/todo";

function DayTodosPanel({ date, todos, onAdd, onSelect, onClose }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{formatLongDate(date)}</p>

      {todos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400">
          No todos on this day.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {todos.map((todo) => {
            const color = TODO_COLOR_MAP[todo.color] ?? TODO_COLOR_MAP.blue;
            return (
              <li key={todo.id}>
                <button
                  type="button"
                  onClick={() => onSelect(todo)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 px-3 py-2.5 text-left hover:bg-zinc-50",
                    todo.completed && "opacity-60",
                  )}
                >
                  <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", color.dot)} />
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium text-zinc-900",
                        todo.completed && "line-through",
                      )}
                    >
                      {todo.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {formatTodoTimeRange(todo)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Close
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="cursor-pointer rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Add todo
        </button>
      </div>
    </div>
  );
}

export default DayTodosPanel;
