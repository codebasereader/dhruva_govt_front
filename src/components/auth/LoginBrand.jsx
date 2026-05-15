import { memo } from "react";
import { cn } from "../../utils/cn";

function LoginBrand({ className }) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <span
        className="flex size-10 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold tracking-tight text-white"
        aria-hidden
      >
        E
      </span>
      <span className="mt-4 block text-lg font-semibold tracking-tight text-zinc-900">
        Event
      </span>
      <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-widest text-zinc-400">
        Planner
      </span>
    </div>
  );
}

export default memo(LoginBrand);
