import AgreedAmountCell from "./AgreedAmountCell";
import BalanceCell from "./BalanceCell";
import BudgetReportCell from "./BudgetReportCell";

/**
 * Builds the 3 ordered finance columns (Budget Report, Agreed Amount, Balance) to
 * append to a tab's existing `columns` array. `getSourceId(row)` resolves the
 * external `_id` for a row; `financeMap`/`reportMap` are the bulk-lookup results
 * keyed by that same id.
 */
export function buildFinanceColumns({
  financeMap,
  reportMap,
  getSourceId,
  onAddReport,
  onCloneReport,
  onViewReport,
  onEditReport,
}) {
  return [
    {
      key: "budgetReport",
      label: "Budget Report",
      className: "min-w-[170px]",
      render: (row) => {
        const sourceId = getSourceId(row);
        const hasReport = Boolean(reportMap[sourceId]);
        return (
          <BudgetReportCell
            hasReport={hasReport}
            onAddNew={() => onAddReport(row)}
            onClone={() => onCloneReport(row)}
            onView={() => onViewReport(row)}
            onEdit={() => onEditReport(row)}
          />
        );
      },
    },
    {
      key: "agreedAmount",
      label: "Agreed Amount",
      className: "min-w-[130px] text-right tabular-nums",
      render: (row) => {
        const sourceId = getSourceId(row);
        return <AgreedAmountCell amount={financeMap[sourceId]?.agreedAmount} />;
      },
    },
    {
      key: "balance",
      label: "Balance",
      className: "min-w-[130px]",
      render: (row) => {
        const sourceId = getSourceId(row);
        return <BalanceCell balance={financeMap[sourceId]?.balance} />;
      },
    },
  ];
}
