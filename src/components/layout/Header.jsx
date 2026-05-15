import { memo, useCallback, useState } from "react";
import { cn } from "../../utils/cn";
import Logo from "./Logo";
import LogoutButton from "./LogoutButton";
import MenuToggle from "./MenuToggle";
import MobileNav from "./MobileNav";
import NavMenu from "./NavMenu";

function Header({ className }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((open) => !open), []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl backdrop-saturate-150",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <NavMenu className="hidden min-w-0 flex-1 justify-center lg:flex" />

        <div className="flex items-center gap-1">
          <LogoutButton className="hidden lg:inline-flex" />
          <MenuToggle isOpen={mobileOpen} onToggle={toggleMobile} />
        </div>
      </div>

      <MobileNav isOpen={mobileOpen} onClose={closeMobile} />
    </header>
  );
}

export default memo(Header);
