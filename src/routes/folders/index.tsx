import { createFileRoute } from "@tanstack/react-router";

import { StructureExplorer } from "#/components/structure-explorer.tsx";
import { validateExplorerSearch } from "#/lib/router-search.ts";
import { explorerHead } from "#/lib/seo.ts";

export const Route = createFileRoute("/folders/")({
  validateSearch: validateExplorerSearch,
  head: ({ match }) =>
    explorerHead("folders", { source: match.search.source, settings: match.search.settings }),
  component: FoldersIndex,
});

function FoldersIndex() {
  const { source } = Route.useSearch();
  return <StructureExplorer kind="folders" sourceOverride={source} />;
}
