import { Link, useNavigate } from "@tanstack/react-router";
import {
  CheckCircleIcon,
  CircleDotIcon,
  ExternalLinkIcon,
  MessageSquareIcon,
  TagsIcon,
} from "lucide-react";
import { useState } from "react";

import { PageTitle } from "#/components/page-title.tsx";
import { useSiteSettings } from "#/components/site-settings-provider.tsx";
import { flattenStructures } from "#/components/structures/structure-data.ts";
import { StructureMarkdown } from "#/components/structures/structure-markdown.tsx";
import { defaultSource, nodeId } from "#/lib/structures.ts";
import { useStructureMarkdown } from "#/lib/use-structure-settings.ts";

interface IssueLabel {
  id: string;
  name: string;
  color?: string;
  bgColor?: string;
}

interface IssueCardData {
  number: number;
  title: string;
  open: boolean;
  author: string;
  openedDaysAgo: number;
  comments: number;
  labels: IssueLabel[];
  kanban?: string;
  statusId?: string;
}

const LABEL_BY = (name: string, color: string, bgColor: string): IssueLabel => ({
  id: name,
  name,
  color,
  bgColor,
});

// Every label shown on an issue card maps to an entry in the software "labels"
// structure whose Markdown explains what the label means.
// Most labels reuse their own entry; a few reuse a sibling readme.
const LABEL_DOC: Record<string, string> = {
  // The type taxonomy documents "Documentation", so the Docs label reuses it.
  Docs: "Documentation",
};

function labelElementId(name: string): string {
  return LABEL_DOC[name] ?? name;
}

const sampleIssues: IssueCardData[] = [
  {
    number: 141,
    title: "fix(auth): refresh session before token expires",
    open: true,
    author: "leo",
    openedDaysAgo: 4,
    comments: 12,
    labels: [LABEL_BY("P0", "#da3633", "#f851491a"), LABEL_BY("Bug", "#c28088", "#321a20")],
    kanban: "In Progress",
  },
  {
    number: 142,
    title: "feat: support custom markdown docs per element",
    open: true,
    author: "marta",
    openedDaysAgo: 2,
    comments: 6,
    labels: [LABEL_BY("P1", "#bd561d", "#bb800926"), LABEL_BY("Feat", "#a97c3b", "#2f2920")],
    kanban: "In Review",
  },
  {
    number: 138,
    title: "refactor(explorer): extract sidebar props",
    open: true,
    author: "leo",
    openedDaysAgo: 9,
    comments: 3,
    labels: [LABEL_BY("P1", "#bd561d", "#bb800926"), LABEL_BY("Refactor", "#facc03", "#37341c")],
    kanban: "In Review",
  },
  {
    number: 140,
    title: "docs: document conventional-commit titles",
    open: true,
    author: "marta",
    openedDaysAgo: 5,
    comments: 2,
    labels: [LABEL_BY("P2", "#c99540", "#bb800926"), LABEL_BY("Docs", "#3199e4", "#388bfd1a")],
    kanban: "To Do",
  },
  {
    number: 139,
    title: "perf: precompute structure hashes",
    open: true,
    author: "isma",
    openedDaysAgo: 8,
    comments: 0,
    labels: [LABEL_BY("P2", "#c99540", "#bb800926"), LABEL_BY("Perf", "#c87e64", "#31221e")],
    kanban: "To Do",
  },
  {
    number: 136,
    title: "ci: cache pnpm store between jobs",
    open: true,
    author: "marta",
    openedDaysAgo: 15,
    comments: 4,
    labels: [LABEL_BY("P3", "#3fb950", "#2ea04326"), LABEL_BY("CI", "#0969da", "#388bfd1a")],
    kanban: "Backlog",
  },
  {
    number: 137,
    title: "style: align card spacing on narrow screens",
    open: false,
    author: "isma",
    openedDaysAgo: 14,
    comments: 1,
    labels: [LABEL_BY("P4", "#9198a1", "#656c7633"), LABEL_BY("Style", "#e3a7fa", "#29133b")],
    kanban: "Done",
  },
  {
    number: 135,
    title: "chore: update license headers",
    open: false,
    author: "leo",
    openedDaysAgo: 21,
    comments: 0,
    labels: [LABEL_BY("P4", "#9198a1", "#656c7633"), LABEL_BY("Chore", "#bd561d", "#db6d281a")],
    kanban: "Done",
  },
];

export function IssueCards() {
  const navigate = useNavigate();
  const site = useSiteSettings();
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const custom = site.settings?.issues;
  const source = custom ? site.url! : defaultSource("issues");
  const nodes = new Map(
    flattenStructures(custom?.structures ?? []).map((node) => [nodeId(node), node]),
  );
  const priorityGroup = custom?.structures
    .find((node) => node.name.trim().toLowerCase() === "labels")
    ?.children?.find((node) => node.name.trim().toLowerCase() === "priority");
  const priorityIds = new Set(flattenStructures(priorityGroup?.children ?? []).map(nodeId));
  const issues: IssueCardData[] = custom
    ? (custom.examples ?? []).map((issue) => ({
        ...issue,
        labels: issue.labels.map((id) => ({ ...nodes.get(id)!, id })),
        kanban: issue.status ? nodes.get(issue.status)?.name : undefined,
        statusId: issue.status,
      }))
    : sampleIssues;
  const descriptionQuery = useStructureMarkdown(
    source,
    hoveredLabel && (custom ? hoveredLabel : labelElementId(hoveredLabel)),
    custom ? (custom.documentation ?? {}) : undefined,
  );

  const openSubPage = (label: string) => {
    const isPriority = custom ? priorityIds.has(label) : /^P\d+$/i.test(label);
    navigate({ to: isPriority ? "/issues/priorities" : "/issues/labels" });
  };

  return (
    <div className="board-layout issue-board-layout">
      <aside className="board-sidebar" aria-label="Issue label descriptions">
        <header className="board-sidebar-header">
          <div className="board-heading">
            <TagsIcon aria-hidden="true" />
            <div>
              <h1>Label logic</h1>
              <p>Hover a label to read what it means</p>
            </div>
          </div>
        </header>
        <div className="board-doc-scroll" aria-live="polite">
          {!hoveredLabel && <div className="sidebar-message">Hover a label to read its logic.</div>}
          {hoveredLabel && descriptionQuery.isPending && <DocSkeleton />}
          {hoveredLabel && descriptionQuery.isError && (
            <div className="sidebar-message">
              <strong>No description found</strong>
              <span>{descriptionQuery.error?.message}</span>
              <button type="button" onClick={() => descriptionQuery.refetch()}>
                Try again
              </button>
            </div>
          )}
          {hoveredLabel && descriptionQuery.data !== undefined && (
            <StructureMarkdown className="board-doc">{descriptionQuery.data}</StructureMarkdown>
          )}
        </div>
      </aside>

      <main className="board-main issue-board-main">
        <section className="issue-cards-page">
          <PageTitle
            eyebrow="Conventional commit naming"
            title="Issues"
            intro={
              <p>
                Example issues whose titles follow{" "}
                <Link to="/naming" className="inline-link">
                  the conventional-commit standard
                </Link>
                , tagged with priority and type labels and a status badge. Hover a label or the
                status badge to read its logic in the sidebar.
              </p>
            }
            action={
              <Link to="/naming" className="naming-cta">
                Read the naming standard <ExternalLinkIcon aria-hidden="true" />
              </Link>
            }
          />

          {site.isPending && <div className="sidebar-message">Loading issues…</div>}
          {site.error && (
            <div className="sidebar-message error-message" role="alert">
              <strong>Could not load issues</strong>
              <span>{site.error.message}</span>
              <button type="button" onClick={site.refetch}>
                Try again
              </button>
            </div>
          )}
          {!site.isPending && !site.error && issues.length === 0 && (
            <p className="sidebar-message">No example issues are configured.</p>
          )}
          <div className="issue-card-list">
            {!site.isPending &&
              !site.error &&
              issues.map((issue) => (
                <IssueCard
                  key={issue.number}
                  issue={issue}
                  activeLabel={hoveredLabel}
                  onHoverLabel={setHoveredLabel}
                  onOpenLabel={openSubPage}
                />
              ))}
          </div>

          <footer className="issue-sub-footer">
            <h2>How issues are tagged</h2>
            <p>
              Every issue carries a priority and one or more type labels. Explore what each means.
            </p>
            <div className="issue-sub-links">
              <Link to="/issues/priorities" className="issue-sub-link">
                <strong>Priorities</strong>
                <span>
                  {custom ? "The priority scale" : "The P0–P4 scale"} that decides how quickly an
                  issue should be tackled.
                </span>
              </Link>
              <Link to="/issues/labels" className="issue-sub-link">
                <strong>Labels</strong>
                <span>The type taxonomy (bug, feat, docs, …) used to categorize issues.</span>
              </Link>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}

function IssueCard({
  issue,
  activeLabel,
  onHoverLabel,
  onOpenLabel,
}: {
  issue: IssueCardData;
  activeLabel: string | null;
  onHoverLabel: (label: string | null) => void;
  onOpenLabel: (label: string) => void;
}) {
  const StatusIcon = issue.open ? CircleDotIcon : CheckCircleIcon;
  const statusColor = issue.open ? "var(--file)" : "var(--accent)";
  return (
    <article className="issue-card">
      <span className="issue-card-state" style={issue.open ? undefined : { color: statusColor }}>
        <StatusIcon aria-hidden="true" />
      </span>

      <div className="issue-card-main">
        <div className="issue-card-title-row">
          <Link to="/naming" className="issue-card-title">
            {issue.title}
          </Link>
        </div>

        <div className="issue-card-labels">
          {issue.labels.map((label) => (
            <button
              key={label.id}
              type="button"
              className="issue-label"
              data-active={label.id === activeLabel || undefined}
              onPointerEnter={() => onHoverLabel(label.id)}
              onFocus={() => onHoverLabel(label.id)}
              onPointerLeave={() => onHoverLabel(null)}
              onBlur={() => onHoverLabel(null)}
              onClick={() => onOpenLabel(label.id)}
              style={{
                color: label.color,
                backgroundColor: label.bgColor,
                borderColor: label.color,
              }}
            >
              {label.name}
            </button>
          ))}
        </div>

        <div className="issue-card-meta">
          {issue.kanban && (
            <button
              type="button"
              className="issue-card-kanban"
              data-active={(issue.statusId ?? issue.kanban) === activeLabel || undefined}
              onPointerEnter={() => onHoverLabel(issue.statusId ?? issue.kanban!)}
              onFocus={() => onHoverLabel(issue.statusId ?? issue.kanban!)}
              onPointerLeave={() => onHoverLabel(null)}
              onBlur={() => onHoverLabel(null)}
            >
              {issue.kanban}
            </button>
          )}
          <span>
            #{issue.number} opened {formatDays(issue.openedDaysAgo)} by {issue.author}
          </span>
          {issue.comments > 0 && (
            <span className="issue-card-comments">
              <MessageSquareIcon aria-hidden="true" />
              {issue.comments}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function formatDays(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function DocSkeleton() {
  return (
    <div className="tree-skeleton" aria-label="Loading description">
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} style={{ width: `${72 + ((index * 13) % 24)}%` }} />
      ))}
    </div>
  );
}
