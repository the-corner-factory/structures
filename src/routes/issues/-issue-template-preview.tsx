import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { useState } from "react";

import { StructureMarkdown } from "#/components/structures/structure-markdown.tsx";
import { copyText } from "#/lib/clipboard.ts";
import { githubIssueTemplate, type IssueTemplate } from "#/lib/issue-templates.ts";

export function IssueTemplatePreview({ template }: { template: IssueTemplate }) {
  const [status, setStatus] = useState<"copied" | "failed" | "">("");

  async function copy() {
    setStatus("");
    try {
      await copyText(template.body);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <section
      id="issue-template"
      className="issue-template-preview"
      aria-labelledby="issue-template-title"
    >
      <header className="issue-template-header">
        <h2 id="issue-template-title">{template.name}</h2>
        <p>{template.description}</p>
        <div className="issue-template-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Copy body"
            title={status === "copied" ? "Copied" : "Copy body"}
            onClick={copy}
          >
            {status === "copied" ? (
              <CheckIcon aria-hidden="true" />
            ) : (
              <CopyIcon aria-hidden="true" />
            )}
          </button>
          <a
            className="naming-cta"
            href={`data:text/markdown;charset=utf-8,${encodeURIComponent(githubIssueTemplate(template))}`}
            download={`${template.id}.md`}
          >
            <DownloadIcon aria-hidden="true" /> Download .md
          </a>
        </div>
        <p
          role="status"
          aria-atomic="true"
          className={status === "failed" ? "error-message" : "sr-only"}
        >
          {status === "failed"
            ? "Could not copy. Download the Markdown file to copy its body manually."
            : status === "copied"
              ? "Issue body copied."
              : ""}
        </p>
      </header>
      <StructureMarkdown className="markdown-body">{template.body}</StructureMarkdown>
      <footer className="issue-template-footer">
        Copy the body into an issue, or add <code>{template.id}.md</code> to{" "}
        <code>.github/ISSUE_TEMPLATE/</code> on your repository’s default branch. The download
        includes GitHub’s template metadata.
      </footer>
    </section>
  );
}
