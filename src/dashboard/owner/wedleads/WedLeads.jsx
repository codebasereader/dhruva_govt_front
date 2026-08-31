import { useState } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  WED_LEADS_TAB_OPTIONS,
  WED_LEADS_TABS,
} from "../../../constants/wedLeads";
import { cn } from "../../../utils/cn";
import BookingsTab from "./BookingsTab";
import LeadsTrackerTab from "./LeadsTrackerTab";

function WedLeads() {
  const [tab, setTab] = useState(WED_LEADS_TABS.TRACKER);

  return (
    <article>
      <PageHeader
        title="Wed-Leads"
        description="Marketing leads tracker and bookings in one place."
      />

      <div
        role="tablist"
        aria-label="Wed-Leads sections"
        className="mb-6 inline-flex rounded-full border border-zinc-200 bg-zinc-50/80 p-1"
      >
        {WED_LEADS_TAB_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={tab === opt.value}
            onClick={() => setTab(opt.value)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === opt.value
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {tab === WED_LEADS_TABS.TRACKER ? <LeadsTrackerTab /> : null}
      {tab === WED_LEADS_TABS.BOOKINGS ? <BookingsTab /> : null}
    </article>
  );
}

export default WedLeads;
