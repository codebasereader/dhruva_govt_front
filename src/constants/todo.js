export const TODO_COLOR_DEFAULT = "blue";

export const TODO_COLORS = [
  {
    value: "blue",
    label: "Blue",
    bg: "bg-blue-100",
    text: "text-blue-800",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
  },
  {
    value: "green",
    label: "Green",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  {
    value: "red",
    label: "Red",
    bg: "bg-red-100",
    text: "text-red-800",
    bar: "bg-red-500",
    dot: "bg-red-500",
  },
  {
    value: "amber",
    label: "Amber",
    bg: "bg-amber-100",
    text: "text-amber-800",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  {
    value: "purple",
    label: "Purple",
    bg: "bg-violet-100",
    text: "text-violet-800",
    bar: "bg-violet-500",
    dot: "bg-violet-500",
  },
  {
    value: "teal",
    label: "Teal",
    bg: "bg-teal-100",
    text: "text-teal-800",
    bar: "bg-teal-500",
    dot: "bg-teal-500",
  },
  {
    value: "pink",
    label: "Pink",
    bg: "bg-pink-100",
    text: "text-pink-800",
    bar: "bg-pink-500",
    dot: "bg-pink-500",
  },
];

export const TODO_COLOR_MAP = Object.fromEntries(
  TODO_COLORS.map((color) => [color.value, color]),
);

export const MAX_TODOS_VISIBLE_PER_DAY = 3;
