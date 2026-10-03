import { createFileRoute } from "@tanstack/react-router";

import { BranchFlowPage } from "#/components/branch-flow-page.tsx";
import { BRANCH_FLOWS, branchSource } from "#/lib/branches.ts";
import { validateExplorerSearch } from "#/lib/router-search.ts";
import { branchesHead } from "#/lib/seo.ts";

export const Route = createFileRoute("/branches")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...validateExplorerSearch(search),
    flow: BRANCH_FLOWS.find(({ dir }) => dir === search.flow)?.dir,
  }),
  head: ({ match }) =>
    branchesHead(
      match.search.flow ? branchSource(match.search.flow) : match.search.source,
      match.search.settings,
    ),
  component: BranchesPage,
});

function BranchesPage() {
  const { source, flow } = Route.useSearch();
  return <BranchFlowPage sourceOverride={source} flow={flow} />;
}
