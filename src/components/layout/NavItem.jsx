import { memo } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

const baseStyles =
  "relative rounded-full px-3.5 py-2 text-sm font-medium tracking-tight transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2";

const inactiveStyles = "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80";

const activeStyles = "text-zinc-900 bg-zinc-100";

const pendingStyles = "cursor-default text-zinc-400";

function NavItem({ to, label, onClick, className }) {
  if (!to) {
    return (
      <span
        title="Coming soon"
        aria-disabled="true"
        className={cn(baseStyles, pendingStyles, className)}
      >
        {label}
      </span>
    );
  }

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(baseStyles, isActive ? activeStyles : inactiveStyles, className)
      }
    >
      {label}
    </NavLink>
  );
}

export default memo(NavItem);
