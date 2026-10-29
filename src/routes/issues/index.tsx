import { createFileRoute } from "@tanstack/react-router";

import { IssueCards } from "#/components/issue-cards.tsx";
import { validateIssueSearch } from "#/lib/router-search.ts";
import { pageHead } from "#/lib/seo.ts";

export const Route = createFileRoute("/issues/")({
  validateSearch: validateIssueSearch,
  head: () =>
    pageHead(
      "Software Issue Templates & Examples",
      "Preview, copy, and download GitHub-ready templates for tasks, bug reports, and feature requests. Explore example issues, type labels, priorities, and statuses.",
    ),
  component: IssuesIndex,
});

function IssuesIndex() {
  return <IssueCards />;
}
