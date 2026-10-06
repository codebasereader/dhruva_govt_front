function BudgetReportCell({ hasReport, onAddNew, onClone, onView, onEdit }) {
  if (hasReport) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={onView}
          className="cursor-pointer rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          View
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="cursor-pointer rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={onAddNew}
        className="cursor-pointer rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Add New
      </button>
      <button
        type="button"
        onClick={onClone}
        className="cursor-pointer rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50"
      >
        Clone
      </button>
    </div>
  );
}

export default BudgetReportCell;
