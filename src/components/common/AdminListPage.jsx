import PageHeader from "./PageHeader";

function AdminListPage({
  title,
  description,
  addLabel = "Add",
  onAdd,
  children,
}) {
  return (
    <article>
      <PageHeader title={title} description={description}>
        <button
          type="button"
          onClick={onAdd}
          className="cursor-pointer rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2"
        >
          {addLabel}
        </button>
      </PageHeader>
      {children}
    </article>
  );
}

export default AdminListPage;
