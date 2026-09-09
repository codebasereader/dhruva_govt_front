import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  createBudgetReport,
  getBudgetReportBySource,
  updateBudgetReport,
} from "../../../../api/budgetReports";
import { getApiErrorMessage } from "../../../../api/utils";
import { WED_LEADS_TAB_BY_SOURCE_TYPE } from "./budgetReportRoute";

const UniverSheetEditor = lazy(
  () => import("../../../../components/common/UniverSheetEditor"),
);

function BudgetReportPage() {
  const { sourceType, sourceId } = useParams();
  const [searchParams] = useSearchParams();
  const sourceLabel = searchParams.get("label") || "";
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const existing = await getBudgetReportBySource({ sourceType, sourceId });
        if (active) setReport(existing);
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, "Failed to load budget report."));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [sourceType, sourceId]);

  const backPath = `/owner/wed-leads?tab=${WED_LEADS_TAB_BY_SOURCE_TYPE[sourceType] ?? "leads-tracker"}`;

  const handleSave = async () => {
    const snapshot = editorRef.current?.getSnapshot();
    if (!snapshot) return;

    setSubmitting(true);
    setError("");
    try {
      const saved = report
        ? await updateBudgetReport(report.id, { snapshot, sourceLabel })
        : await createBudgetReport({ sourceType, sourceId, sourceLabel, snapshot });
      setReport(saved);
      navigate(backPath);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save budget report."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="flex h-[calc(100dvh-4.25rem)] min-h-[640px] flex-col">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-base font-semibold tracking-tight text-zinc-900">
          {report ? "Edit budget report" : "New budget report"}
          {sourceLabel ? (
            <span className="ml-2 font-normal text-zinc-500">— {sourceLabel}</span>
          ) : null}
        </h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            disabled={submitting}
            className="cursor-pointer rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting || loading}
            className="cursor-pointer rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-zinc-200/90">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Loading…
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                Loading spreadsheet…
              </div>
            }
          >
            <UniverSheetEditor
              ref={editorRef}
              initialSnapshot={report?.snapshot}
              className="h-full w-full"
            />
          </Suspense>
        )}
      </div>
    </article>
  );
}

export default BudgetReportPage;
