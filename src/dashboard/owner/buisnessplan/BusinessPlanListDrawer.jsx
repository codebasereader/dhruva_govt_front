import Drawer from "../../../components/common/Drawer";
import { EVENT_TYPE_STYLES, EVENT_TYPES } from "../../../constants/businessPlan";
import { cn } from "../../../utils/cn";
import {
  formatAmountCell,
  formatBelongsToLabel,
  formatEventDateLabel,
  formatEventTypeLabel,
  formatVenueLabel,
} from "../../../utils/businessPlanEvent";

const thClass =
  "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500";
const tdClass = "whitespace-nowrap px-4 py-3.5 text-sm text-zinc-700";
const tdWrapLong =
  "px-4 py-3.5 text-sm text-zinc-700 align-top whitespace-normal break-words [overflow-wrap:anywhere] min-w-[120px] max-w-[220px]";

function EventTypeBadge({ eventType }) {
  const style = EVENT_TYPE_STYLES[eventType];
  const label = formatEventTypeLabel(eventType);
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        style?.bg,
        style?.text,
        style?.border,
      )}
    >
      {label}
    </span>
  );
}

function BusinessPlanListDrawer({
  open,
  onClose,
  events,
  loading,
  monthLabel,
  onEventClick,
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Event list"
      description={monthLabel ? `Events for ${monthLabel}` : undefined}
      size="wide"
    >
      {loading ? (
        <p className="py-12 text-center text-sm text-zinc-400">Loading events…</p>
      ) : !events.length ? (
        <p className="py-12 text-center text-sm text-zinc-400">
          No events for this month with the current filters.
        </p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80">
                <th className={thClass}>Date</th>
                <th className={thClass}>Event</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Belongs to</th>
                <th className={thClass}>District</th>
                <th className={thClass}>Department</th>
                <th className={thClass}>Venue</th>
                <th className={cn(thClass, "text-right")}>Prev. year</th>
                <th className={cn(thClass, "text-right")}>Curr. year</th>
                <th className={cn(thClass, "text-right")}>MCA 5%</th>
                <th className={cn(thClass, "text-right")}>GST %</th>
                <th className={cn(thClass, "text-right")}>GST amt.</th>
                <th className={cn(thClass, "text-right")}>Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {events.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "hover:bg-zinc-50/80",
                    onEventClick && "cursor-pointer",
                  )}
                  onClick={() => onEventClick?.(row)}
                >
                  <td className={tdClass}>{formatEventDateLabel(row.date)}</td>
                  <td className={cn(tdClass, "max-w-[200px] font-medium text-zinc-900")}>
                    <span className="line-clamp-2">{row.eventName || "—"}</span>
                  </td>
                  <td className={tdClass}>
                    <EventTypeBadge eventType={row.eventType} />
                  </td>
                  <td className={tdClass}>{formatBelongsToLabel(row.belongsTo)}</td>
                  <td className={tdWrapLong}>{row.districtName || "—"}</td>
                  <td className={tdWrapLong}>{row.departmentName || "—"}</td>
                  <td className={tdWrapLong}>{formatVenueLabel(row)}</td>
                  <td className={cn(tdClass, "text-right tabular-nums")}>
                    {formatAmountCell(row.previousYearAmount)}
                  </td>
                  <td className={cn(tdClass, "text-right tabular-nums")}>
                    {formatAmountCell(row.currentYearAmount)}
                  </td>
                  <td className={cn(tdClass, "text-right tabular-nums")}>
                    {row.eventType === EVENT_TYPES.MCA
                      ? formatAmountCell(row.mcaSurchargeAmount)
                      : "—"}
                  </td>
                  <td className={cn(tdClass, "text-right tabular-nums")}>
                    {row.gstRate != null ? `${row.gstRate}%` : "—"}
                  </td>
                  <td className={cn(tdClass, "text-right tabular-nums")}>
                    {formatAmountCell(row.gstAmount)}
                  </td>
                  <td className={cn(tdClass, "text-right font-medium tabular-nums text-zinc-900")}>
                    {formatAmountCell(row.finalAmount ?? row.grandTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && events.length > 0 ? (
        <p className="mt-4 text-xs text-zinc-400">
          {events.length} event{events.length === 1 ? "" : "s"}
          {onEventClick ? " · Click a row to edit" : ""}
        </p>
      ) : null}
    </Drawer>
  );
}

export default BusinessPlanListDrawer;
