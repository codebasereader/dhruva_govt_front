import { cn } from "../../utils/cn";

function DataTable({
  columns,
  data,
  loading,
  emptyMessage = "No records found.",
  rowKey,
  renderActions,
}) {
  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-zinc-200/90 bg-white">
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-zinc-200/90 bg-white">
        <p className="text-sm text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm shadow-zinc-900/[0.02]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500",
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
              {renderActions ? (
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((row, index) => (
              <tr key={rowKey(row) ?? index} className="hover:bg-zinc-50/50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-5 py-4 text-zinc-700", col.className)}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {renderActions ? (
                  <td className="px-5 py-4 text-right">{renderActions(row)}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
