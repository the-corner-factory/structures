import { normalizeSettingsUrl } from "./site-settings.ts";

export function validateSiteSearch(search: Record<string, unknown>): { settings?: string } {
  if (typeof search.settings !== "string" || !search.settings.trim()) return {};
  try {
    return { settings: normalizeSettingsUrl(search.settings) };
  } catch {
    return {};
  }
}

interface ExplorerSearch {
  source?: string;
  q?: string;
}

export function validateExplorerSearch(search: Record<string, unknown>): ExplorerSearch {
  return {
    source: typeof search.source === "string" && search.source.trim() ? search.source : undefined,
    q: typeof search.q === "string" && search.q ? search.q : undefined,
  };
}
