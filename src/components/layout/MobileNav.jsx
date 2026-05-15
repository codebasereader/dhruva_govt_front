import { memo, useCallback, useEffect } from "react";
import { useNavItems } from "../../hooks/useNavItems";
import { cn } from "../../utils/cn";
import LogoutButton from "./LogoutButton";
import NavItem from "./NavItem";

function MobileBackdrop({ isOpen, onClose }) {
  return (
    <button
      type="button"
      aria-label="Close menu"
      tabIndex={isOpen ? 0 : -1}
      onClick={onClose}
      className={cn(
        "fixed inset-0 top-[57px] z-30 bg-zinc-900/20 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    />
  );
}

const MOBILE_NAV_PANEL_ID = "mobile-nav-panel";

function MobileNav({ isOpen, onClose }) {
  const navItems = useNavItems();

  const handleEscape = useCallback(
    (event) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  return (
    <>
      <MobileBackdrop isOpen={isOpen} onClose={onClose} />

      <div
        id={MOBILE_NAV_PANEL_ID}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-label="Mobile navigation"
        className={cn(
          "fixed inset-x-0 top-[57px] z-40 border-b border-zinc-200/80 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-xl transition-all duration-300 ease-out lg:hidden",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <nav aria-label="Mobile primary navigation">
          <ul className="flex flex-col gap-1">
            {navItems.map(({ label, path }) => (
              <li key={path}>
                <NavItem
                  to={path}
                  label={label}
                  onClick={onClose}
                  className="block w-full rounded-xl px-4 py-3"
                />
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-zinc-100 pt-4 lg:hidden">
            <LogoutButton
              className="w-full justify-center"
              onAfterLogout={onClose}
            />
          </div>
        </nav>
      </div>
    </>
  );
}

export default memo(MobileNav);
