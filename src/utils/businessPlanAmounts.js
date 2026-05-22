import { EVENT_TYPES, MCA_SURCHARGE_PERCENT } from "../constants/businessPlan";

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseAmountInput(value) {
  if (value === "" || value == null) return 0;
  const n = Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Non-MCA (TENDER, FORGI_DC): GST % applied to current-year amount only.
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
    ? roundMoney(current * (MCA_SURCHARGE_PERCENT / 100))
    : 0;
  const amountBeforeGst = roundMoney(current + mcaSurchargeAmount);
  const gstPercent = gstRate === 18 ? 18 : gstRate === 5 ? 5 : 0;
  const gstBaseAmount = isMca ? amountBeforeGst : current;
  const gstAmount = roundMoney(gstBaseAmount * (gstPercent / 100));
  const grandTotal = roundMoney(gstBaseAmount + gstAmount);

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

export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
