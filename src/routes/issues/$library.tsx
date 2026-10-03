import { createFileRoute } from "@tanstack/react-router";

import { StructureExplorer } from "#/components/structure-explorer.tsx";
import { validateExplorerSearch } from "#/lib/router-search.ts";
import { explorerHead } from "#/lib/seo.ts";

export const Route = createFileRoute("/issues/$library")({
  validateSearch: validateExplorerSearch,
  head: ({ params, match }) =>
    explorerHead("issues", {
      ...params,
      source: match.search.source,
      settings: match.search.settings,
    }),
  component: IssueLibrary,
});

function IssueLibrary() {
  const { library } = Route.useParams();
  const { source } = Route.useSearch();
  return <StructureExplorer kind="issues" library={library} sourceOverride={source} />;
}
