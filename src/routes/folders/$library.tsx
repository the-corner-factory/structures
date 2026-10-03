import { createFileRoute } from "@tanstack/react-router";

import { StructureExplorer } from "#/components/structure-explorer.tsx";
import { validateExplorerSearch } from "#/lib/router-search.ts";
import { explorerHead } from "#/lib/seo.ts";

export const Route = createFileRoute("/folders/$library")({
  validateSearch: validateExplorerSearch,
  head: ({ params, match }) =>
    explorerHead("folders", {
      ...params,
      source: match.search.source,
      settings: match.search.settings,
    }),
  component: FolderLibrary,
});

function FolderLibrary() {
  const { library } = Route.useParams();
  const { source } = Route.useSearch();
  return <StructureExplorer kind="folders" library={library} sourceOverride={source} />;
}
