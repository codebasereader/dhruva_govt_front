import { useEffect, useState } from "react";
import {
  cloneBudgetReport,
  searchBudgetReports,
} from "../../../../api/budgetReports";
import { getApiErrorMessage } from "../../../../api/utils";
import Modal from "../../../../components/common/Modal";

function BudgetReportClonePickerModal({
  open,
  onClose,
  sourceType,
  sourceId,
  sourceLabel,
  onCloned,
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cloningId, setCloningId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { items } = await searchBudgetReports({ sourceType, search, limit: 50 });
        if (active) setResults(items.filter((r) => r.sourceId !== sourceId));
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, sourceType, sourceId, search]);

  const handleClone = async (fromBudgetReportId) => {
    setCloningId(fromBudgetReportId);
    setError("");
    try {
      const cloned = await cloneBudgetReport({
        fromBudgetReportId,
        sourceType,
        sourceId,
        sourceLabel,
      });
      onCloned?.(cloned);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to clone budget report."));
    } finally {
      setCloningId(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Clone a budget report"
      description="Copy an existing budget report's spreadsheet as the starting point for this row."
    >
      <div className="space-y-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by client / event name…"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
        />

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="py-8 text-center text-sm text-zinc-400">Loading…</p>
        ) : null}

        {!loading && results.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            No existing budget reports found.
          </p>
        ) : null}

        <ul className="space-y-2">
          {results.map((report) => (
            <li
              key={report.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {report.sourceLabel || "Untitled"}
                </p>
                <p className="text-xs text-zinc-500">
                  Updated {new Date(report.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleClone(report.id)}
                disabled={cloningId === report.id}
                className="cursor-pointer rounded-full border border-zinc-200 px-3.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                {cloningId === report.id ? "Cloning…" : "Clone"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

export default BudgetReportClonePickerModal;
