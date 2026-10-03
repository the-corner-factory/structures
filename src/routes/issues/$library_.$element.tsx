import { createFileRoute } from "@tanstack/react-router";

import { StructureExplorer } from "#/components/structure-explorer.tsx";
import { validateExplorerSearch } from "#/lib/router-search.ts";
import { explorerHead } from "#/lib/seo.ts";

export const Route = createFileRoute("/issues/$library_/$element")({
  validateSearch: validateExplorerSearch,
  head: ({ params, match }) =>
    explorerHead("issues", {
      ...params,
      source: match.search.source,
      settings: match.search.settings,
    }),
  component: IssueDocument,
});

function IssueDocument() {
  const { library, element } = Route.useParams();
  const { source } = Route.useSearch();
  return (
    <StructureExplorer kind="issues" library={library} element={element} sourceOverride={source} />
  );
}
