import { listEventOccurrences } from "./businessPlanEvent";

/**
 * Build per-week spanning event segments for a month grid (42 cells / 6 weeks).
 * Multi-day events become one bar per week row they cross (Google Calendar style).
 */
export function buildMonthWeekLayouts(cells, events, options = {}) {
  const occurrences = listEventOccurrences(events, options);
  const weeks = [];
  const weekCount = Math.ceil(cells.length / 7);

  for (let w = 0; w < weekCount; w += 1) {
    const weekCells = cells.slice(w * 7, w * 7 + 7);
    if (!weekCells.length) continue;

    const weekStart = weekCells[0].date;
    const weekEnd = weekCells[weekCells.length - 1].date;
    const segments = [];

    for (const occurrence of occurrences) {
      if (occurrence.endDate < weekStart || occurrence.startDate > weekEnd) continue;

      let startCol = -1;
      let endCol = -1;
      for (let i = 0; i < weekCells.length; i += 1) {
        const date = weekCells[i].date;
        if (date >= occurrence.startDate && date <= occurrence.endDate) {
          if (startCol < 0) startCol = i;
          endCol = i;
        }
      }
      if (startCol < 0) continue;

      segments.push({
        occurrenceKey: occurrence.occurrenceKey,
        event: occurrence.event,
        startCol,
        span: endCol - startCol + 1,
        continuesLeft: occurrence.startDate < weekStart,
        continuesRight: occurrence.endDate > weekEnd,
        lane: 0,
      });
    }

    segments.sort((a, b) => {
      if (a.startCol !== b.startCol) return a.startCol - b.startCol;
      if (a.span !== b.span) return b.span - a.span;
      return String(a.event.eventName ?? "").localeCompare(String(b.event.eventName ?? ""));
    });

    const laneEnds = [];
    for (const segment of segments) {
      let lane = 0;
      while (lane < laneEnds.length && laneEnds[lane] >= segment.startCol) {
        lane += 1;
      }
      const lastCol = segment.startCol + segment.span - 1;
      if (lane === laneEnds.length) laneEnds.push(lastCol);
      else laneEnds[lane] = lastCol;
      segment.lane = lane;
    }

    weeks.push({
      weekIndex: w,
      cells: weekCells,
      segments,
      laneCount: laneEnds.length,
    });
  }

  return weeks;
}
