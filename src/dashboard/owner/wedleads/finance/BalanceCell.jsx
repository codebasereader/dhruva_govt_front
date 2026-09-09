import { cn } from "../../../../utils/cn";
import { formatAmountINR } from "../../../../utils/clientLead";

function BalanceCell({ balance }) {
  if (balance == null) {
    return <span className="text-zinc-400">—</span>;
  }

  const settled = balance <= 0;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums",
        settled
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-900",
      )}
    >
      {formatAmountINR(balance)}
    </span>
  );
}

export default BalanceCell;
