import { memo } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

function Logo({ className }) {
  return (
    <Link
      to="/"
      className={cn(
        "group flex shrink-0 items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2 rounded-lg",
        className,
      )}
      aria-label="Event Planner — home"
    >
      <span
        className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold tracking-tight text-white transition-transform group-hover:scale-[1.02]"
        aria-hidden
      >
        E
      </span>
      <span className="hidden sm:block">
        <span className="block text-sm font-semibold tracking-tight text-zinc-900">
          Event
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-widest text-zinc-400">
          Planner
        </span>
      </span>
    </Link>
  );
}

export default memo(Logo);
