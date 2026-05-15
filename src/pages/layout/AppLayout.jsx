import { Outlet } from "react-router-dom";
import Header from "../../components/layout/Header";
import MainContent from "../../components/layout/MainContent";

function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fafafa] text-zinc-900 antialiased">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.08),transparent)]"
        aria-hidden
      />

      <Header />

      <MainContent>
        <Outlet />
      </MainContent>
    </div>
  );
}

export default AppLayout;
