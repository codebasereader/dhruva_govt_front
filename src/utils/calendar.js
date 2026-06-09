const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatMonthKey(year, monthIndex) {
  const m = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${m}`;
}

export function parseMonthKey(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  return { year: y, monthIndex: m - 1 };
}

export function getMonthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

export function getCalendarCells(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = lastOfMonth.getDate();

  const cells = [];

  const prevMonthLast = new Date(year, monthIndex, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i -= 1) {
    const day = prevMonthLast - i;
    const d = new Date(year, monthIndex - 1, day);
    cells.push({
      date: toDateString(d),
      day,
      inCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, monthIndex, day);
    cells.push({
      date: toDateString(d),
      day,
      inCurrentMonth: true,
      isToday: isSameDay(d, new Date()),
    });
  }

  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day += 1) {
    const d = new Date(year, monthIndex + 1, day);
    cells.push({
      date: toDateString(d),
      day,
      inCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
    });
  }

  return cells;
}

export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function shiftMonth(year, monthIndex, delta) {
  const d = new Date(year, monthIndex + delta, 1);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

export function shiftYear(year, delta) {
  return year + delta;
}

export function getYearLabel(year) {
  return String(year);
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getMonthName(monthIndex) {
  return MONTH_NAMES[monthIndex] ?? "";
}

export function getMonthShortName(monthIndex) {
  return new Date(2000, monthIndex, 1).toLocaleString("default", { month: "short" });
}

/** Options for month picker: { value: monthIndex, label } */
export function getMonthPickerOptions() {
  return MONTH_NAMES.map((label, monthIndex) => ({ value: monthIndex, label }));
}

/** Year options centered on current year. */
export function getYearPickerOptions(range = 10) {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current - range; y <= current + range; y += 1) {
    years.push({ value: y, label: String(y) });
  }
  return years;
}

/** Inclusive YYYY-MM-DD bounds for a calendar month. */
export function getMonthDateRange(year, monthIndex) {
  return {
    startDate: toDateString(new Date(year, monthIndex, 1)),
    endDate: toDateString(new Date(year, monthIndex + 1, 0)),
  };
}

export { WEEKDAYS };
