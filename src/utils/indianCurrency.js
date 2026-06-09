const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function wordsUnder100(n) {
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return one ? `${TENS[ten]} ${ONES[one]}` : TENS[ten];
}

function wordsUnder1000(n) {
  if (n < 100) return wordsUnder100(n);
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const head = `${ONES[hundred]} Hundred`;
  return rest ? `${head} ${wordsUnder100(rest)}` : head;
}

/** Digits only → integer (no decimals). */
export function parseIndianAmountInput(value) {
  if (value === "" || value == null) return 0;
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return 0;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Indian grouping: 12,34,567 */
export function formatIndianInteger(value) {
  if (value === "" || value == null) return "";
  const n = parseIndianAmountInput(value);
  if (!Number.isFinite(n) || n < 0) return "";
  const s = String(n);
  if (s.length <= 3) return s;
  const lastThree = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${grouped},${lastThree}`;
}

export function amountToIndianRupeeWords(value) {
  if (value === "" || value == null) return "";
  const n = parseIndianAmountInput(value);
  if (n === 0) return "Zero Rupees Only";

  const parts = [];
  let remaining = n;

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  if (crore) parts.push(`${wordsUnder1000(crore)} Crore`);

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  if (lakh) parts.push(`${wordsUnder100(lakh)} Lakh`);

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  if (thousand) parts.push(`${wordsUnder1000(thousand)} Thousand`);

  if (remaining) parts.push(wordsUnder1000(remaining));

  return `${parts.join(" ")} Rupees Only`;
}
