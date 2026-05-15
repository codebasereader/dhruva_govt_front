import { memo } from "react";
import { cn } from "../../utils/cn";

function MainContent({ children, className }) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8",
        className,
      )}
    >
      {children}
    </main>
  );
}

export default memo(MainContent);
