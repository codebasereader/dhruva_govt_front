import { formatAmountINR } from "../../../../utils/clientLead";

function AgreedAmountCell({ amount }) {
  if (amount == null) {
    return <span className="text-zinc-400">—</span>;
  }
  return <span className="tabular-nums">{formatAmountINR(amount)}</span>;
}

export default AgreedAmountCell;
