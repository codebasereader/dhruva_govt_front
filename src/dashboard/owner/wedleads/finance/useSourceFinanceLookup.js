import { useCallback, useEffect, useState } from "react";
import { bulkGetClientFinances } from "../../../../api/clientFinances";
import { bulkGetBudgetReports } from "../../../../api/budgetReports";

/**
 * Bulk-fetches finance + budget-report presence for a set of external source ids
 * (avoids N+1 requests when rendering a table page). Re-fetches whenever `ids` changes.
 */
export function useSourceFinanceLookup({ sourceType, ids }) {
  const [financeMap, setFinanceMap] = useState({});
  const [reportMap, setReportMap] = useState({});
  const [loading, setLoading] = useState(false);

  const idsKey = ids.join(",");

  const refetch = useCallback(async () => {
    if (!ids.length) {
      setFinanceMap({});
      setReportMap({});
      return;
    }

    setLoading(true);
    try {
      const [finances, reports] = await Promise.all([
        bulkGetClientFinances({ sourceType, sourceIds: ids }),
        bulkGetBudgetReports({ sourceType, sourceIds: ids }),
      ]);
      setFinanceMap(finances);
      setReportMap(reports);
    } catch {
      setFinanceMap({});
      setReportMap({});
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType, idsKey]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { financeMap, reportMap, loading, refetch };
}
