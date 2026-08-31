import { useEffect, useRef, useState } from "react";
import { CALENDAR_VIEW_MODES } from "../../../constants/businessPlan";
import { cn } from "../../../utils/cn";
import {
  getMonthLabel,
  getMonthPickerOptions,
  getYearLabel,
  getYearPickerOptions,
} from "../../../utils/calendar";

function CalendarPeriodPicker({
  viewMode,
  year,
  monthIndex,
  onYearChange,
  onMonthChange,
  onApply,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const isYearView = viewMode === CALENDAR_VIEW_MODES.YEAR;

  const [draftYear, setDraftYear] = useState(year);
  const [draftMonthIndex, setDraftMonthIndex] = useState(monthIndex);

  useEffect(() => {
    if (!open) return;
    setDraftYear(year);
    setDraftMonthIndex(monthIndex);
  }, [open, year, monthIndex]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const label = isYearView ? getYearLabel(year) : getMonthLabel(year, monthIndex);

  const handleApply = () => {
    onYearChange(draftYear);
    if (!isYearView) onMonthChange(draftMonthIndex);
    onApply?.();
    setOpen(false);
  };

  const monthOptions = getMonthPickerOptions();
  const yearOptions = getYearPickerOptions(15);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "min-w-[180px] cursor-pointer rounded-lg px-2 py-1 text-left text-lg font-semibold text-zinc-900",
          "hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {label}
        <span className="ml-1.5 inline-block text-sm text-zinc-400" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={isYearView ? "Select year" : "Select month and year"}
          className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg shadow-zinc-900/10"
        >
          <div className={cn("grid gap-3", !isYearView && "grid-cols-2")}>
            {!isYearView ? (
              <div>
                <label
                  htmlFor="bp-picker-month"
                  className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500"
                >
                  Month
                </label>
                <select
                  id="bp-picker-month"
                  value={draftMonthIndex}
                  onChange={(e) => setDraftMonthIndex(Number(e.target.value))}
                  className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-400/40"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className={isYearView ? "" : undefined}>
              <label
                htmlFor="bp-picker-year"
                className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                Year
              </label>
              <select
                id="bp-picker-year"
                value={draftYear}
                onChange={(e) => setDraftYear(Number(e.target.value))}
                className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-400/40"
              >
                {yearOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="cursor-pointer rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CalendarPeriodPicker;
