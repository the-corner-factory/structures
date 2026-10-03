import { Link } from "@tanstack/react-router";
import { BookOpenIcon, FileCode2Icon, GaugeIcon, TrendingUpIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PageTitle } from "#/components/page-title.tsx";
import { useSiteSettings } from "#/components/site-settings-provider.tsx";
import { AnchorHeading } from "#/components/structures/anchor-heading.tsx";
import { flattenStructures } from "#/components/structures/structure-data.ts";
import type { SiteStructureNode } from "#/lib/site-settings.ts";
import { nodeId } from "#/lib/structures.ts";

interface PriorityEntry {
  id?: string;
  level: string;
  description?: string;
  example?: string;
  tone?: string;
}

const PRIORITIES: PriorityEntry[] = [
  {
    level: "P0",
    description:
      "Critical, release-blocking impact on users or business. Requires immediate, hands-on attention.",
    example: "checkout is down for all users",
    tone: "#da3633",
  },
  {
    level: "P1",
    description:
      "High impact on users or business, but less urgent than P0. Schedule for the current sprint when possible.",
    example: "session refresh breaks token renewal",
    tone: "#bd561d",
  },
  {
    level: "P2",
    description:
      "Important work that affects users or operations, but is not time-critical. Address within the next few sprints.",
    example: "slow explorer sidebar on large trees",
    tone: "#c99540",
  },
  {
    level: "P3",
    description:
      "Noticeable but limited impact. Schedule for future sprints once higher-priority work is done.",
    example: "polish empty-state copy",
    tone: "#3fb950",
  },
  {
    level: "P4",
    description:
      "Low priority with minimal impact. Handle as time permits or keep on the backlog for later.",
    example: "document edge-case behaviour",
    tone: "#9198a1",
  },
];

export function PrioritiesStandard() {
  const { settings, isPending, error, refetch } = useSiteSettings();
  const custom = settings?.issues;
  const group = custom?.structures
    .find((node) => node.name.trim().toLowerCase() === "labels")
    ?.children?.find((node) => node.name.trim().toLowerCase() === "priority");
  const priorities: PriorityEntry[] = custom
    ? (flattenStructures(group?.children ?? []) as SiteStructureNode[])
        .filter((node) => !node.children?.length)
        .map((node) => ({
          id: nodeId(node),
          level: node.name,
          description: node.description,
          example: node.example,
          tone: node.color,
        }))
    : PRIORITIES;
  return (
    <section className="naming-page">
      <PageTitle
        eyebrow="Issue triage"
        title="Priorities"
        intro={
          <p>
            A shared scale for how quickly an issue should be tackled. Every issue is tagged with a
            priority so the team can agree on what gets picked up first.
          </p>
        }
      />

      <AnchorHeading level={2} className="naming-section-title">
        Priority levels
      </AnchorHeading>
      <div className="naming-type-grid">
        {isPending && <p className="sidebar-message">Loading priorities…</p>}
        {error && (
          <div className="sidebar-message error-message" role="alert">
            <strong>Could not load priorities</strong>
            <span>{error.message}</span>
            <button type="button" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        )}
        {!isPending &&
          !error &&
          priorities.map((entry) => <PriorityCard key={entry.id ?? entry.level} entry={entry} />)}
        {!isPending && !error && priorities.length === 0 && (
          <p className="sidebar-message">No priority levels are configured.</p>
        )}
      </div>

      <AnchorHeading level={2} className="naming-section-title">
        How to choose
      </AnchorHeading>
      <SectionCard icon={TrendingUpIcon} title="Fix the most blocking work first">
        <p>
          Work that blocks a release or affects many users takes priority over work that can wait.
          {custom
            ? " Pick up higher-priority work before less urgent tasks."
            : " A P0 should be picked up before a P2, even if the P2 looks more interesting."}
        </p>
      </SectionCard>
      <SectionCard icon={GaugeIcon} title="Tie priority to user impact">
        <p>
          Estimate how many people are affected and how badly. The more users affected and the more
          it breaks the workflow, the higher the priority.
        </p>
      </SectionCard>
      <SectionCard icon={BookOpenIcon} title="Re-evaluate as things change">
        <p>
          Priorities are not permanent. Revisit a card when a workaround appears, a customer is
          blocked, or a release deadline moves, and promote or demote it accordingly.
        </p>
      </SectionCard>

      <div className="naming-links-row">
        <Link to="/issues" className="naming-cta">
          <FileCode2Icon aria-hidden="true" /> See example issues
        </Link>
      </div>
    </section>
  );
}

function PriorityCard({ entry }: { entry: PriorityEntry }) {
  return (
    <article className="naming-type-card">
      <div className="naming-type-heading">
        <code className="naming-type-prefix" style={{ color: entry.tone }}>
          {entry.level}
        </code>
        {entry.description && <span>{entry.description}</span>}
      </div>
      {entry.example && (
        <p className="naming-type-example">
          <code>{entry.example}</code>
        </p>
      )}
    </article>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="naming-section-card">
      <Icon aria-hidden="true" />
      <AnchorHeading level={3}>{title}</AnchorHeading>
      {children}
    </div>
  );
}
