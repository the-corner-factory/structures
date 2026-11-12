import { createFileRoute } from "@tanstack/react-router";

import { pageHead } from "#/lib/seo.ts";

import { PrioritiesStandard } from "./-priorities-standard";

export const Route = createFileRoute("/issues/priorities")({
  head: () =>
    pageHead(
      "Issue Priority Levels: P0 to P4",
      "Learn the P0–P4 issue priority scale with practical examples. Triage work by user impact, urgency, and release risk, and reassess priorities as needs change.",
    ),
  component: IssuesPriorities,
});

function IssuesPriorities() {
  return <PrioritiesStandard />;
}
