import { memo, useCallback, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

const triggerBaseStyles =
  "relative flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium tracking-tight transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2";

const triggerInactiveStyles = "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80";
const triggerOpenStyles = "text-zinc-900 bg-zinc-100";

const CLOSE_DELAY_MS = 150;

function MoreMenu({ items, label = "More" }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimeout();
    setIsOpen(true);
  }, [clearCloseTimeout]);

  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS);
  }, [clearCloseTimeout]);

  const closeMenu = useCallback(() => {
    clearCloseTimeout();
    setIsOpen(false);
  }, [clearCloseTimeout]);

  const handleBlur = useCallback(
    (event) => {
      if (!containerRef.current?.contains(event.relatedTarget)) {
        closeMenu();
      }
    },
    [closeMenu],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") closeMenu();
    },
    [closeMenu],
  );

  if (!items?.length) return null;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={cn(triggerBaseStyles, isOpen ? triggerOpenStyles : triggerInactiveStyles)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        onFocus={openMenu}
      >
        {label}
        <svg
          className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        role="menu"
        aria-label={label}
        className={cn(
          "absolute right-0 top-full z-50 mt-2 min-w-[12rem] origin-top-right rounded-2xl border border-zinc-200/80 bg-white p-1.5 shadow-lg shadow-zinc-900/5 backdrop-blur-xl transition-all duration-150 ease-out",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        {items.map(({ label: itemLabel, path }) => (
          <NavLink
            key={path ?? itemLabel}
            to={path}
            role="menuitem"
            onClick={closeMenu}
            className={({ isActive }) =>
              cn(
                "block rounded-xl px-3 py-2 text-sm font-medium tracking-tight transition-colors duration-150",
                isActive
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900",
              )
            }
          >
            {itemLabel}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default memo(MoreMenu);
