import { ACCOUNT_GST_PERCENT, ADVANCE_STATUSES } from "../constants/finance";
import { parseIndianAmountInput } from "./indianCurrency";

function roundRupee(value) {
  return Math.round(value);
}

/**
 * accountGst = round(accountAmount * 18%)
 * accountAmountWithGst = accountAmount + accountGst
 * cashAmount = max(agreedAmount - accountAmountWithGst, 0)
 */
export function computeAccountSplit({ agreedAmount, accountAmount }) {
  const agreed = parseIndianAmountInput(agreedAmount);
  const account = parseIndianAmountInput(accountAmount);
  const accountGst = roundRupee(account * (ACCOUNT_GST_PERCENT / 100));
  const accountAmountWithGst = account + accountGst;
  const cashAmount = Math.max(agreed - accountAmountWithGst, 0);

  return {
    accountGst,
    accountAmountWithGst,
    cashAmount,
    isOverAgreed: accountAmountWithGst > agreed,
  };
}

/** Balance = Agreed Amount − sum of advances with status "Received". Pending advances don't count. */
export function computeBalance({ agreedAmount, advances }) {
  const received = (advances || [])
    .filter((advance) => advance.status === ADVANCE_STATUSES.RECEIVED)
    .reduce((sum, advance) => sum + parseIndianAmountInput(advance.amount), 0);

  return parseIndianAmountInput(agreedAmount) - received;
}
