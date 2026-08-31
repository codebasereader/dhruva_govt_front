import { useMemo } from "react";
import { EVENT_TYPE_STYLES } from "../../../constants/businessPlan";
import { cn } from "../../../utils/cn";
import { WEEKDAYS } from "../../../utils/calendar";
import { buildMonthWeekLayouts } from "../../../utils/calendarMonthLayout";
import {
  formatAmountCell,
  formatEventLocationSummary,
} from "../../../utils/businessPlanEvent";

const LANE_HEIGHT_PX = 52;
const LANE_GAP_PX = 2;

export function EventPill({
  event,
  onSelect,
  continuesLeft = false,
  continuesRight = false,
  className,
}) {
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
        "h-full w-full overflow-hidden border px-1.5 py-1 text-left text-[10px] leading-snug",
        "cursor-pointer transition-opacity hover:opacity-90",
        continuesLeft ? "rounded-l-none border-l-0" : "rounded-l-md",
        continuesRight ? "rounded-r-none border-r-0" : "rounded-r-md",
        style.bg,
        style.text,
        style.border,
        className,
      )}
      title={tooltip}
    >
      <span className="block truncate font-semibold leading-tight">{event.eventName}</span>
      <span className="mt-0.5 block truncate opacity-90">{location}</span>
      <span className="mt-0.5 block truncate font-medium tabular-nums">{finalAmount}</span>
    </button>
  );
}

function CalendarMonth({
  cells,
  events = [],
  year,
  monthIndex,
  onDateClick,
  onEventClick,
}) {
  const weeks = useMemo(
    () => buildMonthWeekLayouts(cells, events, { year, monthIndex }),
    [cells, events, year, monthIndex],
  );

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

      <div className="divide-y divide-zinc-100">
        {weeks.map((week) => {
          const eventsHeight =
            week.laneCount > 0
              ? week.laneCount * LANE_HEIGHT_PX + (week.laneCount - 1) * LANE_GAP_PX
              : 0;

          return (
            <div key={week.weekIndex} className="relative">
              <div className="grid grid-cols-7">
                {week.cells.map((cell) => (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => onDateClick(cell.date)}
                    className={cn(
                      "min-h-[40px] cursor-pointer border-r border-zinc-100 p-1.5 text-left transition-colors last:border-r-0",
                      "hover:bg-zinc-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400/50",
                      !cell.inCurrentMonth && "bg-zinc-50/40 text-zinc-400",
                    )}
                    style={{
                      paddingBottom: eventsHeight + 8,
                    }}
                  >
                    <span
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-full text-xs font-medium",
                        cell.isToday && cell.inCurrentMonth && "bg-zinc-900 text-white",
                      )}
                    >
                      {cell.day}
                    </span>
                  </button>
                ))}
              </div>

              {week.laneCount > 0 ? (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 px-0.5"
                  style={{ height: eventsHeight + 6 }}
                >
                  {week.segments.map((segment) => (
                    <div
                      key={`${week.weekIndex}-${segment.occurrenceKey}-${segment.lane}`}
                      className="pointer-events-auto absolute"
                      style={{
                        left: `calc(${(segment.startCol / 7) * 100}% + 2px)`,
                        width: `calc(${(segment.span / 7) * 100}% - 4px)`,
                        top: segment.lane * (LANE_HEIGHT_PX + LANE_GAP_PX),
                        height: LANE_HEIGHT_PX,
                      }}
                    >
                      <EventPill
                        event={segment.event}
                        onSelect={onEventClick}
                        continuesLeft={segment.continuesLeft}
                        continuesRight={segment.continuesRight}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CalendarMonth;
