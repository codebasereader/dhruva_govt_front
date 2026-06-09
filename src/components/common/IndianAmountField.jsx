import {
  amountToIndianRupeeWords,
  formatIndianInteger,
  parseIndianAmountInput,
} from "../../utils/indianCurrency";
const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-400/40 disabled:cursor-not-allowed disabled:opacity-60";

function IndianAmountField({
  id,
  label,
  value,
  onChange,
  placeholder = "0",
  required,
  disabled,
  error,
}) {
  const display = formatIndianInteger(value);
  const words = value ? amountToIndianRupeeWords(value) : "";

  const handleChange = (event) => {
    const digits = event.target.value.replace(/[^\d]/g, "");
    onChange(digits);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
      >
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={inputClass}
        autoComplete="off"
      />
      {words ? (
        <p className="text-xs leading-relaxed text-zinc-500">{words}</p>
      ) : null}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

export { parseIndianAmountInput };
export default IndianAmountField;
