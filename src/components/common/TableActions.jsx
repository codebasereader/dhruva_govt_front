function TableActions({ onEdit, onDelete }) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      >
        Edit
      </button>
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}

export default TableActions;
