import { EVENT_TYPE_OPTIONS, EVENT_TYPE_STYLES } from "../../../constants/businessPlan";
import { cn } from "../../../utils/cn";
import { formatTypeStatAmount } from "../../../utils/businessPlanEvent";

function TypeStatCard({ row }) {
  const style = EVENT_TYPE_STYLES[row.eventType] ?? {
    bg: "bg-zinc-100",
    text: "text-zinc-800",
    border: "border-zinc-200",
    dot: "bg-zinc-400",
  };

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        style.bg,
        style.border,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("size-2.5 shrink-0 rounded-full", style.dot)} />
        <p className={cn("text-sm font-semibold", style.text)}>{row.label}</p>
      </div>
      <p className={cn("text-2xl font-semibold tabular-nums", style.text)}>
        {row.count}
        <span className="ml-1 text-sm font-medium opacity-80">
          {row.count === 1 ? "event" : "events"}
        </span>
      </p>
      <p className={cn("mt-1 text-sm font-medium tabular-nums", style.text)}>
        {formatTypeStatAmount(row)}
      </p>
    </div>
  );
}

function TypeStatCompactLine({ row }) {
  const style = EVENT_TYPE_STYLES[row.eventType] ?? { dot: "bg-zinc-400" };
  if (row.count === 0) return null;

  return (
    <p className="flex items-start gap-1.5 text-[10px] leading-snug text-zinc-700">
      <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", style.dot)} />
      <span>
        <span className="font-semibold text-zinc-800">{row.label}</span>
        {" — "}
        {row.count} {row.count === 1 ? "event" : "events"}
        {" — "}
        <span className="font-medium tabular-nums">{formatTypeStatAmount(row)}</span>
      </span>
    </p>
  );
}

/** Summary cards below the calendar (all four types, including zeros). */
export function ActualPlanTypeStatsCards({ stats, title }) {
  const rows = stats?.length ? stats : EVENT_TYPE_OPTIONS.map((opt) => ({
    eventType: opt.value,
    label: opt.label,
    count: 0,
    totalFinalAmount: 0,
    unsetAmountCount: 0,
  }));

  return (
    <section className="mt-6">
      {title ? (
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">{title}</h3>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <TypeStatCard key={row.eventType} row={row} />
        ))}
      </div>
    </section>
  );
}

/** Compact lines for yearly month tiles (only types with count &gt; 0). */
export function ActualPlanTypeStatsCompact({ stats }) {
  const active = (stats ?? []).filter((row) => row.count > 0);
  if (!active.length) {
    return <p className="text-[10px] text-zinc-400">No events</p>;
  }

  return (
    <div className="space-y-1">
      {active.map((row) => (
        <TypeStatCompactLine key={row.eventType} row={row} />
      ))}
    </div>
  );
}

export default ActualPlanTypeStatsCards;
