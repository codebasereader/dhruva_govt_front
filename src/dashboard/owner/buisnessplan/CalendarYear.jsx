import { formatMonthKey, getMonthShortName } from "../../../utils/calendar";
import { aggregateEventTypeStats } from "../../../utils/businessPlanEvent";
import { cn } from "../../../utils/cn";
import { BusinessPlanTypeStatsCompact } from "./BusinessPlanTypeStats";

function CalendarYear({ year, eventsByMonth, onMonthClick }) {
  const now = new Date();
  const currentMonthKey = formatMonthKey(now.getFullYear(), now.getMonth());

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm shadow-zinc-900/2">
      <div className="grid grid-cols-2 gap-px bg-zinc-100 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }, (_, monthIndex) => {
          const monthKey = formatMonthKey(year, monthIndex);
          const monthEvents = eventsByMonth[monthKey] ?? [];
          const monthStats = aggregateEventTypeStats(monthEvents);
          const isCurrentMonth = monthKey === currentMonthKey;
          const totalEvents = monthStats.reduce((sum, row) => sum + row.count, 0);

          return (
            <button
              key={monthKey}
              type="button"
              onClick={() => onMonthClick(monthIndex)}
              className={cn(
                "min-h-[168px] cursor-pointer bg-white p-3 text-left transition-colors",
                "hover:bg-zinc-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400/50",
                isCurrentMonth && "ring-2 ring-inset ring-zinc-900/10",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-zinc-900">
                  {getMonthShortName(monthIndex)}
                </span>
                {totalEvents > 0 ? (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium tabular-nums text-zinc-600">
                    {totalEvents}
                  </span>
                ) : null}
              </div>
              <BusinessPlanTypeStatsCompact stats={monthStats} />
            </button>
          );
        })}
      </div>
      <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-400">
        Click a month to open the monthly calendar.
      </p>
    </section>
  );
}

export default CalendarYear;
