import { memo, useId } from "react";
import { cn } from "../../utils/cn";

const inputStyles =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors outline-none focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-400/40";

function AuthField({
  id: idProp,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  className,
  inputClassName,
  disabled = false,
  children,
}) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={cn(
            inputStyles,
            children && "pr-11",
            disabled && "cursor-not-allowed opacity-60",
            inputClassName,
          )}
        />
        {children}
      </div>
    </div>
  );
}

export default memo(AuthField);
