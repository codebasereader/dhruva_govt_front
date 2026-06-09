import { memo } from "react";
import { cn } from "../../utils/cn";

function PageHeader({ title, description, className, children, titleAddon }) {
  return (
    <header className={cn("mb-8", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              {title}
            </h1>
            {titleAddon}
          </div>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </header>
  );
}

export default memo(PageHeader);

