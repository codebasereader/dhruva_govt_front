import { cn } from "../../utils/cn";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-400/40 disabled:cursor-not-allowed disabled:opacity-60";

function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  as = "input",
  options,
  children,
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
      >
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </label>

      {as === "select" ? (
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={cn(inputClass, "cursor-pointer")}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClass}
        />
      )}

      {children}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

export default FormField;
