import { useCallback, useEffect } from "react";
import { cn } from "../../utils/cn";

function Drawer({ open, onClose, title, description, children, className }) {
  const handleEscape = useCallback(
    (event) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 cursor-pointer bg-zinc-900/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          "relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl shadow-zinc-900/10 animate-[slideIn_0.25s_ease-out]",
          className,
        )}
      >
        <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-5">
          <div>
            <h2
              id="drawer-title"
              className="text-lg font-semibold tracking-tight text-zinc-900"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-zinc-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </aside>
    </div>
  );
}

export default Drawer;
