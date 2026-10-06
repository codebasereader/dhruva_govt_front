function FinanceActionsCell({ onEdit, onView }) {
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={onView}
        className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      >
        View
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      >
        Edit
      </button>
    </div>
  );
}

export default FinanceActionsCell;
