import { memo } from "react";
import { useNavItems } from "../../hooks/useNavItems";
import MoreMenu from "./MoreMenu";
import NavItem from "./NavItem";

function NavMenu({ className, onItemClick }) {
  const { mainItems, moreItems } = useNavItems();

  return (
    <nav className={className} aria-label="Primary navigation">
      <ul className="flex flex-wrap items-center gap-0.5">
        {mainItems.map(({ label, path }) => (
          <li key={path ?? label}>
            <NavItem to={path} label={label} onClick={onItemClick} />
          </li>
        ))}
        {moreItems.length > 0 && (
          <li>
            <MoreMenu items={moreItems} />
          </li>
        )}
      </ul>
    </nav>
  );
}

export default memo(NavMenu);
