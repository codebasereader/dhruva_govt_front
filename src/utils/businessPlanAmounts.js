import { EVENT_TYPES, MCA_SURCHARGE_PERCENT } from "../constants/businessPlan";
import { parseIndianAmountInput } from "./indianCurrency";

function roundRupee(value) {
  return Math.round(value);
}

export function parseAmountInput(value) {
  return parseIndianAmountInput(value);
}

/** True when the field has an explicit value (including 0), not blank. */
export function isEnteredAmount(value) {
  return value !== "" && value != null && parseAmountInput(value) >= 0;
}

/**
 * Non-MCA (TENDER, 4g types): GST % applied to current-year amount only.
 *   finalAmount = currentYear + GST
 *
 * MCA: extra 5% on current year, then GST % on (current + MCA surcharge).
 *   finalAmount = (currentYear + MCA 5%) + GST
 */
export function calculateBusinessPlanAmounts({
  eventType,
  currentYearAmount,
  gstRate,
}) {
  const current = parseAmountInput(currentYearAmount);
  const isMca = eventType === EVENT_TYPES.MCA;
  const mcaSurchargeAmount = isMca
    ? roundRupee(current * (MCA_SURCHARGE_PERCENT / 100))
    : 0;
  const amountBeforeGst = roundRupee(current + mcaSurchargeAmount);
  const gstPercent = gstRate === 18 ? 18 : gstRate === 5 ? 5 : 0;
  const gstBaseAmount = isMca ? amountBeforeGst : current;
  const gstAmount = roundRupee(gstBaseAmount * (gstPercent / 100));
  const grandTotal = roundRupee(gstBaseAmount + gstAmount);

  return {
    currentYearAmount: current,
    mcaSurchargePercent: isMca ? MCA_SURCHARGE_PERCENT : 0,
    mcaSurchargeAmount,
    amountBeforeGst,
    gstBaseAmount,
    gstPercent,
    gstAmount,
    grandTotal,
    finalAmount: grandTotal,
  };
}

/** Build one `yearlyAmounts[]` entry with computed totals for API payload. */
export function buildYearlyAmountEntry(year, fields) {
  const amounts = calculateBusinessPlanAmounts({
    eventType: fields.eventType,
    currentYearAmount: fields.currentYearAmount,
    gstRate: fields.gstRate,
  });

  return {
    year: Number(year),
    previousYearAmount:
      fields.previousYearAmount === "" || fields.previousYearAmount == null
        ? null
        : parseAmountInput(fields.previousYearAmount),
    referredBy: fields.referredBy?.trim() || null,
    currentYearAmount: amounts.currentYearAmount,
    gstRate: fields.gstRate,
    mcaSurchargePercent: amounts.mcaSurchargePercent,
    mcaSurchargeAmount: amounts.mcaSurchargeAmount,
    amountBeforeGst: amounts.amountBeforeGst,
    gstBaseAmount: amounts.gstBaseAmount,
    gstAmount: amounts.gstAmount,
    grandTotal: amounts.grandTotal,
    finalAmount: amounts.finalAmount,
  };
}

export function formatMoney(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
