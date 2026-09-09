import { lazy, Suspense, useEffect, useState } from "react";
import { getBudgetReportBySource } from "../../../../api/budgetReports";
import Drawer from "../../../../components/common/Drawer";

const UniverSheetEditor = lazy(
  () => import("../../../../components/common/UniverSheetEditor"),
);

/** View-only preview of a saved budget report. Use BudgetReportPage for add/edit. */
function BudgetReportDrawer({ open, onClose, sourceType, sourceId, sourceLabel }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !sourceType || !sourceId) {
      setReport(null);
      return undefined;
    }

    let active = true;
    (async () => {
      setLoading(true);
      try {
        const existing = await getBudgetReportBySource({ sourceType, sourceId });
        if (active) setReport(existing);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, sourceType, sourceId]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="full"
      title="Budget report"
      description={sourceLabel ? `${sourceLabel} — view only, use Edit to make changes.` : undefined}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="min-h-[65vh] flex-1 overflow-hidden rounded-2xl border border-zinc-200/90">
          {loading ? (
            <div className="flex h-full min-h-[65vh] items-center justify-center text-sm text-zinc-400">
              Loading…
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="flex h-full min-h-[65vh] items-center justify-center text-sm text-zinc-400">
                  Loading spreadsheet…
                </div>
              }
            >
              {open ? (
                <UniverSheetEditor
                  initialSnapshot={report?.snapshot}
                  readOnly
                  className="h-full min-h-[65vh] w-full"
                />
              ) : null}
            </Suspense>
          )}
        </div>
      </div>
    </Drawer>
  );
}

export default BudgetReportDrawer;
