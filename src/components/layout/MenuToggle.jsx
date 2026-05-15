import { memo } from "react";
import { cn } from "../../utils/cn";

function MenuToggle({ isOpen, onToggle, className }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls="mobile-nav-panel"
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2 lg:hidden",
        className,
      )}
    >
      <span className="sr-only">Menu</span>
      <svg
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        aria-hidden
      >
        {isOpen ? (
          <path d="M6 6l12 12M18 6L6 18" />
        ) : (
          <>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </>
        )}
      </svg>
    </button>
  );
}

export default memo(MenuToggle);
