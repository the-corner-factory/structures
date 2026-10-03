"use client";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRightIcon, GitBranchIcon } from "lucide-react";
import { useState } from "react";

import { BranchGraph } from "#/components/branch-graph.tsx";
import { useSiteSettings } from "#/components/site-settings-provider.tsx";
import { BRANCH_FLOWS, branchSource, fetchBranchFlow, type BranchNode } from "#/lib/branches.ts";
import { useHydrated } from "#/lib/use-hydrated.ts";

export function BranchFlowPage({
  sourceOverride,
  flow: preset,
}: {
  sourceOverride?: string;
  flow?: string;
}) {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const { url, settings } = useSiteSettings();
  const customFlow = settings?.branches;
  const source = customFlow
    ? undefined
    : preset
      ? branchSource(preset)
      : url
        ? undefined
        : sourceOverride;
  const [hoveredBranch, setHoveredBranch] = useState<BranchNode | null>(null);

  const flowQuery = useQuery({
    queryKey: ["branch-flow", source],
    queryFn: ({ signal }) => fetchBranchFlow(source!, signal),
    enabled: hydrated && Boolean(source),
  });

  const openPreset = (dir: string) => {
    navigate({
      to: "/branches",
      search: (previous) => ({ ...previous, source: undefined, flow: dir }),
      resetScroll: false,
    });
  };

  // No flow selected: show the preset chooser.
  if (!source && !customFlow) {
    return <BranchFlowChooser onSelect={openPreset} />;
  }

  const flow = customFlow ?? flowQuery.data;
  const isPending = !customFlow && flowQuery.isPending;
  const error = !customFlow && flowQuery.error;
  const branch = hoveredBranch && flow?.branches.includes(hoveredBranch) ? hoveredBranch : null;

  return (
    <div className="board-layout branch-page">
      <aside className="board-sidebar" aria-label="Branch description">
        <header className="board-sidebar-header">
          <div className="board-heading">
            <GitBranchIcon aria-hidden="true" />
            <div>
              <h1>{flow?.libraryName ?? "Branch flow"}</h1>
              <p>Branching strategy</p>
            </div>
          </div>
          {flow && !customFlow && (
            <button
              type="button"
              className="branch-change"
              onClick={() =>
                navigate({
                  to: "/branches",
                  search: (previous) => ({ ...previous, source: undefined, flow: undefined }),
                  resetScroll: false,
                })
              }
            >
              Change strategy
            </button>
          )}
        </header>
        <div className="board-doc-scroll" aria-live="polite">
          {isPending && <div className="sidebar-message">Loading strategy…</div>}
          {error && (
            <div className="sidebar-message error-message">
              <strong>Could not load strategy</strong>
              <span>{error.message}</span>
              <button type="button" onClick={() => flowQuery.refetch()}>
                Try again
              </button>
            </div>
          )}
          {branch && (
            <article className="board-doc">
              <h2>{branch.label || branch.id}</h2>
              <p>
                {branch.description || "No description provided for this branch in this strategy."}
              </p>
            </article>
          )}
          {flow && !branch && (
            <article className="board-doc">
              <h2>About this strategy</h2>
              <p>{flow.description || "No description provided for this strategy."}</p>
              <p>Hover or focus a branch to read its description.</p>
            </article>
          )}
        </div>
      </aside>

      <main className="branch-main">
        {isPending && <div className="sidebar-message">Loading strategy…</div>}
        {error && (
          <div className="sidebar-message error-message">
            <strong>Could not load strategy</strong>
            <span>{error.message}</span>
            <button type="button" onClick={() => flowQuery.refetch()}>
              Try again
            </button>
          </div>
        )}
        {flow && (
          <div className="branch-diagram">
            <BranchGraph flow={flow} onHover={setHoveredBranch} />
          </div>
        )}
      </main>
    </div>
  );
}

function BranchFlowChooser({ onSelect }: { onSelect: (dir: string) => void }) {
  return (
    <section className="library-chooser topics-page">
      <div className="chooser-intro">
        <p className="eyebrow">Branching standards</p>
        <h1>Explore a branching strategy</h1>
        <p>
          Open an opinionated branching model or load your website settings from the navigation.
          Hover any branch in the diagram to read what it is for.
        </p>
      </div>

      <div className="framework-grid">
        <section className="framework-group">
          <h2>Strategies</h2>
          <div>
            {BRANCH_FLOWS.map((flow) => (
              <button type="button" key={flow.dir} onClick={() => onSelect(flow.dir)}>
                <span>{flow.name}</span>
                <ChevronRightIcon />
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
