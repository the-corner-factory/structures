import { useNavigate } from "@tanstack/react-router";
import { ListOrderedIcon, SquareKanbanIcon, TagsIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { useSiteSettings } from "#/components/site-settings-provider.tsx";
import { StructureMarkdown } from "#/components/structures/structure-markdown.tsx";
import { nodeId, type BoardVariant, type FolderStructure } from "#/lib/structures.ts";
import { useStructureMarkdown, useStructureSettings } from "#/lib/use-structure-settings.ts";

interface BoardConfig {
  group: string;
  subgroup?: string;
  kind: "kanban" | "gallery";
  heading: string;
  hint: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: LucideIcon;
}

const BOARD_CONFIG: Record<BoardVariant, BoardConfig> = {
  kanban: {
    group: "kanban",
    kind: "kanban",
    heading: "Kanban board",
    hint: "Hover a column to read its description",
    emptyTitle: "No board columns",
    emptyDescription: "This structure does not define a “Kanban” group with columns.",
    icon: SquareKanbanIcon,
  },
  labels: {
    group: "types",
    kind: "gallery",
    heading: "Labels",
    hint: "Hover a label to read its description",
    emptyTitle: "No labels",
    emptyDescription: "This structure does not define any issue labels.",
    icon: TagsIcon,
  },
  priorities: {
    group: "labels",
    subgroup: "priority",
    kind: "gallery",
    heading: "Priorities",
    hint: "Hover a priority to read its description",
    emptyTitle: "No priorities",
    emptyDescription: "This structure does not define priority labels.",
    icon: ListOrderedIcon,
  },
};

export function StructureBoard({
  variant,
  sourceOverride,
}: {
  variant: BoardVariant;
  sourceOverride?: string;
}) {
  const navigate = useNavigate();
  const site = useSiteSettings();
  const config = BOARD_CONFIG[variant];
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const settingsQuery = useStructureSettings("issues", { sourceOverride });
  const { source, custom, settings } = settingsQuery;
  const group = useMemo(() => {
    const root = settings?.structures.find(
      (item) => item.name.trim().toLowerCase() === config.group,
    );
    if (!config.subgroup || !root) return root;
    return root.children?.find((child) => child.name.trim().toLowerCase() === config.subgroup);
  }, [settings, config.group, config.subgroup]);
  const items = group?.children ?? [];
  const gallerySections: FolderStructure[] =
    config.kind === "gallery"
      ? variant === "priorities" || items.some((item) => !item.children?.length)
        ? [{ name: config.heading, type: "folder", children: items }]
        : items
      : [];

  const descriptionQuery = useStructureMarkdown(
    source,
    hoveredId,
    custom ? (custom.documentation ?? {}) : undefined,
  );

  const openDocumentation = (element: string) => {
    navigate({
      to: "/issues/$library/$element",
      params: { library: settings?.libraryName || "software", element },
      search: (previous) => ({
        ...previous,
        source: !site.url ? sourceOverride : undefined,
      }),
    });
  };

  const renderColumn = (column: FolderStructure) => {
    const id = nodeId(column);
    // “transparent” colors mean the label renders without a tint.
    const color = column.color && column.color !== "transparent" ? column.color : undefined;
    const bgColor = column.bgColor && column.bgColor !== "transparent" ? column.bgColor : undefined;
    return (
      <button
        type="button"
        className="kanban-column"
        key={id}
        aria-label={column.name}
        data-active={id === hoveredId || undefined}
        onPointerEnter={() => setHoveredId(id)}
        onFocus={() => setHoveredId(id)}
        onClick={() => openDocumentation(id)}
      >
        <span
          className="kanban-column-header"
          style={bgColor ? { backgroundColor: bgColor } : undefined}
        >
          <span
            className="label-color"
            style={color ? { color, backgroundColor: bgColor, borderColor: color } : undefined}
            aria-hidden="true"
          />
          <span className="kanban-column-name">{column.name}</span>
        </span>
        <span className="kanban-column-body" aria-hidden="true" />
      </button>
    );
  };

  const Icon = config.icon;

  return (
    <div className="board-layout">
      <aside className="board-sidebar" aria-label={`${config.heading} descriptions`}>
        <header className="board-sidebar-header">
          <div className="board-heading">
            <Icon aria-hidden="true" />
            <div>
              <h1>{config.heading}</h1>
              <p>{config.hint}</p>
            </div>
          </div>
        </header>
        <div className="board-doc-scroll" aria-live="polite">
          {!hoveredId && <div className="sidebar-message">{config.hint}.</div>}
          {hoveredId && descriptionQuery.isPending && <DocSkeleton />}
          {hoveredId && descriptionQuery.isError && (
            <div className="sidebar-message">
              <strong>No description found</strong>
              <span>{descriptionQuery.error?.message}</span>
              <button type="button" onClick={() => descriptionQuery.refetch()}>
                Try again
              </button>
            </div>
          )}
          {hoveredId && descriptionQuery.data !== undefined && (
            <StructureMarkdown className="board-doc">{descriptionQuery.data}</StructureMarkdown>
          )}
        </div>
      </aside>

      <main className="board-main">
        {settingsQuery.isPending && <BoardSkeleton heading={config.heading} />}
        {settingsQuery.isError && (
          <div className="sidebar-message error-message">
            <strong>Could not load structure</strong>
            <span>{settingsQuery.error?.message}</span>
            <button type="button" onClick={() => settingsQuery.refetch()}>
              Try again
            </button>
          </div>
        )}
        {settings && config.kind === "kanban" && items.length > 0 && (
          <div className="kanban-board">{items.map(renderColumn)}</div>
        )}
        {settings && config.kind === "gallery" && gallerySections.length > 0 && (
          <div className="label-gallery">
            {gallerySections.map((item) => (
              <LabelSection
                key={nodeId(item)}
                group={item}
                activeId={hoveredId}
                onHover={setHoveredId}
                onOpen={openDocumentation}
              />
            ))}
          </div>
        )}
        {settings && items.length === 0 && (
          <section className="empty-document">
            <Icon aria-hidden="true" />
            <p className="eyebrow">{settings.libraryName || "Custom structure"}</p>
            <h1>{config.emptyTitle}</h1>
            <p>{config.emptyDescription}</p>
          </section>
        )}
      </main>
    </div>
  );
}

function LabelSection({
  group,
  depth = 0,
  activeId,
  onHover,
  onOpen,
}: {
  group: FolderStructure;
  depth?: number;
  activeId: string | null;
  onHover: (id: string) => void;
  onOpen: (element: string) => void;
}) {
  const children = group.children ?? [];
  const elements = children.filter((child) => !child.children?.length);
  const folders = children.filter((child) => child.children?.length);
  const Heading = depth === 0 ? "h2" : "h3";
  return (
    <section className="label-section">
      <Heading className={`label-section-heading${depth > 0 ? " sub" : ""}`}>{group.name}</Heading>
      {elements.length > 0 && (
        <div className="label-pills">
          {elements.map((element) => {
            const id = nodeId(element);
            // “transparent” colors mean the label renders without a tint.
            const color =
              element.color && element.color !== "transparent" ? element.color : undefined;
            const bgColor =
              element.bgColor && element.bgColor !== "transparent" ? element.bgColor : undefined;
            return (
              <button
                type="button"
                className="label-pill"
                key={id}
                aria-label={element.name}
                data-active={id === activeId || undefined}
                onPointerEnter={() => onHover(id)}
                onFocus={() => onHover(id)}
                onClick={() => onOpen(id)}
                style={
                  color || bgColor
                    ? { backgroundColor: bgColor, color, borderColor: color }
                    : undefined
                }
              >
                <span>{element.name}</span>
              </button>
            );
          })}
        </div>
      )}
      {folders.map((folder) => (
        <LabelSection
          key={nodeId(folder)}
          group={folder}
          depth={depth + 1}
          activeId={activeId}
          onHover={onHover}
          onOpen={onOpen}
        />
      ))}
    </section>
  );
}

function BoardSkeleton({ heading }: { heading: string }) {
  return (
    <div className="board-skeleton" aria-label={`Loading ${heading.toLowerCase()}`}>
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
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
