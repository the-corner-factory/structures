import { createFileRoute } from "@tanstack/react-router";

import { StructureExplorer } from "#/components/structure-explorer.tsx";
import { validateExplorerSearch } from "#/lib/router-search.ts";
import { explorerHead } from "#/lib/seo.ts";

export const Route = createFileRoute("/folders/$library_/$element")({
  validateSearch: validateExplorerSearch,
  head: ({ params, match }) =>
    explorerHead("folders", {
      ...params,
      source: match.search.source,
      settings: match.search.settings,
    }),
  component: FolderDocument,
});

function FolderDocument() {
  const { library, element } = Route.useParams();
  const { source } = Route.useSearch();
  return (
    <StructureExplorer kind="folders" library={library} element={element} sourceOverride={source} />
  );
}
