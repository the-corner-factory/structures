import { useQuery } from "@tanstack/react-query";

import { useSiteSettings } from "#/components/site-settings-provider.tsx";
import {
  defaultSource,
  fetchMarkdown,
  fetchSettings,
  librarySource,
  type ExplorerKind,
} from "#/lib/structures.ts";
import { useHydrated } from "#/lib/use-hydrated.ts";

export function useStructureSettings(
  kind: ExplorerKind,
  { sourceOverride, library }: { sourceOverride?: string; library?: string } = {},
) {
  const site = useSiteSettings();
  const hydrated = useHydrated();
  const custom = site.settings?.[kind];
  const source = custom
    ? site.url!
    : ((!site.url ? sourceOverride : undefined) ??
      (library ? librarySource(library) : defaultSource(kind)));
  const query = useQuery({
    queryKey: ["structure-settings", source],
    queryFn: ({ signal }) => fetchSettings(source, signal),
    enabled: hydrated && !custom && !site.isPending && !site.error,
  });
  return {
    ...query,
    source,
    custom,
    settings: custom ?? query.data,
    isPending: !custom && query.isPending,
    isError: !custom && query.isError,
  };
}

export function useStructureMarkdown(
  source: string,
  element: string | null | undefined,
  documentation?: Record<string, string>,
) {
  const site = useSiteSettings();
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: ["structure-markdown", source, element],
    queryFn: ({ signal }) => fetchMarkdown(source, element!, signal),
    enabled: hydrated && Boolean(element) && documentation === undefined,
  });
  if (documentation === undefined) return query;
  const key = element?.toLowerCase();
  const data = key && Object.hasOwn(documentation, key) ? documentation[key] : undefined;
  const missing = Boolean(element) && data === undefined;
  return {
    data,
    isPending: false,
    isError: missing,
    error: missing ? new Error(`No documentation was found for “${element}”.`) : null,
    refetch: site.refetch,
  };
}
