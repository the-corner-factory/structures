import { FileQuestionIcon, RotateCwIcon } from "lucide-react";

import { useStructureMarkdown } from "#/lib/use-structure-settings.ts";

import { StructureMarkdown } from "./structures/structure-markdown";

export default function MarkdownViewer({
  source,
  element,
  documentation,
}: {
  source: string;
  element: string;
  documentation?: Record<string, string>;
}) {
  const markdownQuery = useStructureMarkdown(source, element, documentation);

  if (markdownQuery.isPending) {
    return (
      <div className="document-loading">
        <span />
        Loading documentation…
      </div>
    );
  }

  if (markdownQuery.isError) {
    return (
      <section className="document-error">
        <FileQuestionIcon />
        <p className="eyebrow">Documentation unavailable</p>
        <h1>{element}</h1>
        <p>{markdownQuery.error?.message}</p>
        <button type="button" className="primary-button" onClick={() => markdownQuery.refetch()}>
          <RotateCwIcon /> Try again
        </button>
      </section>
    );
  }

  return (
    <StructureMarkdown className="markdown-body">{markdownQuery.data ?? ""}</StructureMarkdown>
  );
}
