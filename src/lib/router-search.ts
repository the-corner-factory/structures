import { ISSUE_TEMPLATE_ID } from "./issue-templates.ts";
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

export interface IssueSearch extends ExplorerSearch {
  view?: "templates";
  template?: string;
}

export function validateIssueSearch(search: Record<string, unknown>): IssueSearch {
  return {
    ...validateExplorerSearch(search),
    view: search.view === "templates" ? "templates" : undefined,
    template:
      typeof search.template === "string" && ISSUE_TEMPLATE_ID.test(search.template)
        ? search.template
        : undefined,
  };
}
