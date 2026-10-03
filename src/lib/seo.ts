import { BRANCH_FLOWS, branchSettingsUrl, branchSource } from "./branches.ts";
import { EXPLORER_FRAMEWORKS, settingsDocumentUrl, type ExplorerKind } from "./structures.ts";

export function pageHead(title: string, description: string) {
  const fullTitle = `${title} | Structures`;
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
    ],
  };
}

export function explorerHead(
  kind: ExplorerKind,
  {
    library,
    element,
    source,
    settings,
  }: { library?: string; element?: string; source?: string; settings?: string },
) {
  // A source override determines the displayed catalog, even when the URL names another library.
  const catalog = settings
    ? undefined
    : source
      ? /^\/assets\/([^/]+)\/settings\.json$/.exec(settingsDocumentUrl(source))?.[1]
      : (library ?? (kind === "issues" ? "software" : undefined));

  if (!catalog && !source && !settings) {
    return pageHead(
      "Project Folder Structures",
      "Explore Angular, Go, and TanStack Start / React folder structures. Browse documented files and directories or load your own project structure.",
    );
  }

  const label =
    EXPLORER_FRAMEWORKS[kind]
      .flatMap((group) => group.children)
      .find((entry) => entry.library === catalog)?.name ??
    (catalog === "user" ? "Personal" : catalog || "Custom");

  if (element) {
    return pageHead(
      `${element} — ${label} ${kind === "folders" ? "Folders" : "Issues"}`,
      kind === "folders"
        ? `Read about ${element} in the ${label} folder structure and see how this entry fits into the project's file and directory organization.`
        : `Read about ${element} in the ${label} issue workflow and learn how this category helps organize, prioritize, or track project work.`,
    );
  }

  return pageHead(
    `${label} ${kind === "folders" ? "Folder Structure" : "Issue Workflow"}`,
    kind === "folders"
      ? `Explore the ${label} project folder structure, with documentation for files and directories to help you organize and maintain your codebase.`
      : `Browse the ${label} issue structure and read documentation for its labels, categories, and workflow. Learn how each entry helps organize project work.`,
  );
}

export function branchesHead(source?: string, settings?: string) {
  if (settings) source = settings;
  if (!source) {
    return pageHead(
      "Git Branching Strategies",
      "Explore Git Flow, GitHub Flow, GitLab Flow, and trunk-based development with interactive diagrams explaining branch roles and merge paths.",
    );
  }

  const preset = BRANCH_FLOWS.find(
    (flow) => branchSettingsUrl(branchSource(flow.dir)) === branchSettingsUrl(source),
  );
  return pageHead(
    preset ? `${preset.name} Branching Strategy` : "Custom Git Branching Strategy",
    preset
      ? `Explore the ${preset.name} branching strategy in an interactive Git diagram. Learn each branch's role and follow the merge paths between branches.`
      : "Explore a custom Git branching strategy loaded from a JSON source. Inspect branch roles, descriptions, and merge paths in an interactive diagram.",
  );
}
