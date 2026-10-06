import { memo } from "react";
import { cn } from "../../utils/cn";

function MainContent({ children, className, fullWidth }) {
  return (
    <main
      className={cn(
        "flex-1 px-4 sm:px-6 lg:px-8",
        fullWidth ? "py-2" : "py-8 sm:py-10",
        !fullWidth && "mx-auto w-full max-w-7xl",
        className,
      )}
    >
      {children}
    </main>
  );
}

export default memo(MainContent);
