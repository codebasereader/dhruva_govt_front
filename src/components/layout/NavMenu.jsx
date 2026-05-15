import { memo } from "react";
import { useNavItems } from "../../hooks/useNavItems";
import NavItem from "./NavItem";

function NavMenu({ className, onItemClick }) {
  const navItems = useNavItems();

  return (
    <nav className={className} aria-label="Primary navigation">
      <ul className="flex flex-wrap items-center gap-0.5">
        {navItems.map(({ label, path }) => (
          <li key={path}>
            <NavItem to={path} label={label} onClick={onItemClick} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default memo(NavMenu);
