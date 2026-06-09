import { EVENT_TYPE_STYLES } from "../../../constants/businessPlan";
import { cn } from "../../../utils/cn";
import { WEEKDAYS } from "../../../utils/calendar";
import {
  formatAmountCell,
  formatEventLocationSummary,
} from "../../../utils/businessPlanEvent";

export function EventPill({ event, onSelect }) {
  const style = EVENT_TYPE_STYLES[event.eventType] ?? {
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    border: "border-zinc-200",
  };
  const location = formatEventLocationSummary(event);
  const finalAmount = formatAmountCell(event.finalAmount ?? event.grandTotal, {
    amountsConfigured: event.amountsConfigured,
  });
  const tooltip = [event.eventName, location, finalAmount].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(event);
      }}
      className={cn(
        "mb-0.5 w-full rounded px-1.5 py-1 text-left text-[10px] leading-snug",
        "cursor-pointer border transition-opacity hover:opacity-90",
        style.bg,
        style.text,
        style.border,
      )}
      title={tooltip}
    >
      <span className="block font-semibold leading-tight">{event.eventName}</span>
      <span className="mt-0.5 block opacity-90">{location}</span>
      <span className="mt-0.5 block font-medium tabular-nums">{finalAmount}</span>
    </button>
  );
}

function CalendarMonth({ cells, eventsByDate, onDateClick, onEventClick }) {
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
          const dayEvents = eventsByDate[cell.date] ?? [];
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onDateClick(cell.date)}
              className={cn(
                "min-h-[112px] cursor-pointer border-b border-r border-zinc-100 p-1.5 text-left transition-colors last:border-r-0",
                "hover:bg-zinc-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400/50",
                !cell.inCurrentMonth && "bg-zinc-50/40 text-zinc-400",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-xs font-medium",
                  cell.isToday && cell.inCurrentMonth && "bg-zinc-900 text-white",
                )}
              >
                {cell.day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <EventPill key={ev.id} event={ev} onSelect={onEventClick} />
                ))}
                {dayEvents.length > 3 ? (
                  <span className="block px-1 text-[10px] text-zinc-400">
                    +{dayEvents.length - 3} more
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

export default CalendarMonth;
