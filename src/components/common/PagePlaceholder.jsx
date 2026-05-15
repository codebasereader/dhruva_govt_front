import { memo } from "react";
import PageHeader from "./PageHeader";

function PagePlaceholder({ title }) {
  return (
    <article>
      <PageHeader
        title={title}
        description={`Manage ${title.toLowerCase()} from this workspace.`}
      />
      <section className="rounded-2xl border border-dashed border-zinc-200/90 bg-white px-6 py-16 text-center shadow-sm shadow-zinc-900/[0.02]">
        <p className="text-sm font-medium text-zinc-400">
          Content for {title} will appear here.
        </p>
      </section>
    </article>
  );
}

export default memo(PagePlaceholder);
