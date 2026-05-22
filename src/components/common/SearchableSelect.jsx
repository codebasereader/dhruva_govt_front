import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../../utils/cn";

const triggerClass =
  "flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-left text-sm text-zinc-900 transition-colors outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-400/40 disabled:cursor-not-allowed disabled:opacity-60";

function SearchableSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = "Choose…",
  required,
  disabled,
  error,
  loading,
  headerAction,
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((opt) => opt.value === value);
  const displayLabel = selected?.label ?? placeholder;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, closeDropdown]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    closeDropdown();
  };

  return (
    <div ref={rootRef} className="relative space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
        >
          {label}
          {required ? <span className="text-red-400"> *</span> : null}
        </label>
        {headerAction ?? null}
      </div>

      <button
        type="button"
        id={id}
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled || loading) return;
          if (open) closeDropdown();
          else setOpen(true);
        }}
        className={cn(
          triggerClass,
          !selected && "text-zinc-400",
          open && "border-zinc-300 bg-white ring-2 ring-zinc-400/40",
        )}
      >
        <span className="truncate">{loading ? "Loading…" : displayLabel}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
          role="presentation"
        >
          <div className="border-b border-zinc-100 p-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-400/40"
              onKeyDown={(e) => {
                if (e.key === "Escape") closeDropdown();
              }}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-52 overflow-y-auto py-1"
            aria-label={label}
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-zinc-400">No matches found</li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.value} role="option" aria-selected={opt.value === value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full cursor-pointer px-4 py-2.5 text-left text-sm transition-colors hover:bg-zinc-50",
                      opt.value === value
                        ? "bg-zinc-100 font-medium text-zinc-900"
                        : "text-zinc-700",
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={cn("size-4 shrink-0 text-zinc-400 transition-transform", open && "rotate-180")}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default SearchableSelect;
