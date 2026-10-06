import { getRouteApi } from "@tanstack/react-router";
import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  CheckIcon,
  DownloadIcon,
  FileTextIcon,
  LayoutGridIcon,
  NetworkIcon,
} from "lucide-react";
import { useState } from "react";

import { AgenticMap } from "#/components/agentic-map.tsx";
import { PageTitle } from "#/components/page-title.tsx";
import { useSiteSettings } from "#/components/site-settings-provider.tsx";
import { StructureMarkdown } from "#/components/structures/structure-markdown.tsx";
import {
  AGENT_EXAMPLES,
  AGENTIC_ELEMENTS,
  AGENTIC_RELATIONSHIPS,
  AGENTIC_TEMPLATES,
  INSTRUCTION_FILES,
  type AgenticSearch,
} from "#/lib/agentic.ts";

const route = getRouteApi("/agentic");

export function AgenticPage() {
  const { view = "map", template } = route.useSearch();
  const navigate = route.useNavigate();
  const { settings } = useSiteSettings();
  const templates = AGENTIC_TEMPLATES.map((item) => ({ ...item, ...settings?.agentic?.[item.id] }));
  const elements = templates.filter((item) => AGENTIC_ELEMENTS.some(({ id }) => id === item.id));
  const instructionFiles = templates.filter((item) =>
    INSTRUCTION_FILES.some(({ id }) => id === item.id),
  );
  const agentExamples = templates.filter((item) => AGENT_EXAMPLES.some(({ id }) => id === item.id));
  const selected = templates.find((item) => item.id === template) ?? elements[0];
  const updateSearch = (next: AgenticSearch) =>
    navigate({
      search: (previous) => ({ ...previous, ...next }),
      hash: true,
      resetScroll: false,
      hashScrollIntoView: false,
    });
  const setView = (next: "map" | "cards") =>
    updateSearch({ view: next === "map" ? undefined : next });
  const setSelected = (next: (typeof AGENTIC_ELEMENTS)[number]) =>
    updateSearch({ template: next.id === AGENTIC_ELEMENTS[0].id ? undefined : next.id });
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const explored = hovered ?? focused;
  const relationship = AGENTIC_RELATIONSHIPS[explored ?? ""];
  const embedded = relationship?.includes ?? [];
  const conditional = relationship?.conditional ?? [];
  const isInstructionFile = instructionFiles.some((file) => file.id === selected.id);
  const isAgentExample = agentExamples.some((example) => example.id === selected.id);
  const selectedGroupId = isInstructionFile ? "instructions" : isAgentExample ? "agents" : null;
  const selectedGroup = isInstructionFile
    ? elements.find((item) => item.id === "instructions")!.name
    : isAgentExample
      ? elements.find((item) => item.id === "agents")!.name
      : null;

  return (
    <main className="library-chooser topics-page agentic-page">
      <PageTitle
        eyebrow="Agent systems, explained"
        title="Agentic"
        intro="Understand the pieces behind an agent: what runs it, what it can do, and what guides its work. Follow the connections, then explore each building block."
      />

      <section className="agentic-explore" aria-labelledby="agentic-explore-title">
        <div className="agentic-section-heading">
          <div>
            <h2 id="agentic-explore-title">
              {view === "map" ? "Anatomy of an agent system" : "Explore customizations"}
            </h2>
            <p>
              {view === "map"
                ? "Nine building blocks. One connected system."
                : "Explore contents, configuration, and example templates."}
            </p>
          </div>
          <fieldset className="agentic-view-switch" aria-label="Explore view">
            <label>
              <input
                className="sr-only"
                type="radio"
                name="agentic-view"
                value="map"
                checked={view === "map"}
                onChange={() => {
                  setView("map");
                  setHovered(null);
                  setFocused(null);
                }}
              />
              <NetworkIcon aria-hidden="true" /> System map
            </label>
            <label>
              <input
                className="sr-only"
                type="radio"
                name="agentic-view"
                value="cards"
                checked={view === "cards"}
                onChange={() => setView("cards")}
              />
              <LayoutGridIcon aria-hidden="true" /> Cards & templates
            </label>
          </fieldset>
        </div>
        {view === "map" ? (
          <AgenticMap selected={selected} onSelect={setSelected} templates={templates} />
        ) : (
          <>
            <p className="agentic-card-legend">
              Yellow: contents or configuration. Dashed: host extension or custom delivery.
            </p>
            <div className="agentic-grid">
              {elements.map((element) => {
                const Icon = element.icon;
                const active = selected.id === element.id;
                const instructions = element.id === "instructions";
                return (
                  <div
                    key={element.id}
                    className="agentic-card"
                    data-selected={active || element.id === selectedGroupId}
                    data-embedded={
                      embedded.includes(element.id) || conditional.includes(element.id)
                    }
                    data-conditional={conditional.includes(element.id)}
                    onPointerEnter={() => setHovered(element.id)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setFocused(element.id)}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
                    }}
                  >
                    <button
                      type="button"
                      className="agentic-card-select"
                      aria-label={element.name}
                      aria-describedby={`${element.id}-description`}
                      aria-pressed={active}
                      aria-controls="agentic-readme"
                      onClick={() => setSelected(element)}
                    >
                      <span className="agentic-card-heading">
                        <Icon aria-hidden="true" />
                        <strong>{element.name}</strong>
                        {active && <CheckIcon className="agentic-selected" aria-hidden="true" />}
                      </span>
                      <span id={`${element.id}-description`} className="agentic-card-description">
                        {element.description}
                      </span>
                    </button>
                    {element.id === "agents" &&
                      agentExamples.map((example) => (
                        <button
                          key={example.id}
                          type="button"
                          className="agentic-file-badge agentic-prompt-badge"
                          title={example.description}
                          aria-pressed={selected.id === example.id}
                          aria-controls="agentic-readme"
                          onClick={() => setSelected(example)}
                        >
                          {example.name}
                        </button>
                      ))}
                    {instructions && (
                      <div
                        className="agentic-instruction-files"
                        role="group"
                        aria-label="Instruction files"
                      >
                        {instructionFiles.map((file) => (
                          <button
                            key={file.id}
                            type="button"
                            className="agentic-file-badge"
                            aria-pressed={selected.id === file.id}
                            aria-controls="agentic-readme"
                            onClick={() => setSelected(file)}
                          >
                            {file.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="agentic-card-footer">
                      <span>{element.kind}</span>
                      <span>
                        {active ? "Selected" : instructions ? "Read description" : "Read template"}{" "}
                        <ArrowDownIcon aria-hidden="true" />
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="agentic-relationships" role="status" aria-atomic="true">
              {relationship ? (
                <>
                  <strong>{elements.find((element) => element.id === explored)?.name}: </strong>
                  {relationship.description}
                </>
              ) : (
                "Hover or focus a card to explore its contents and configuration. Dashed highlights need the host extension or custom delivery described here. Calling another component does not imply containment."
              )}
            </p>
          </>
        )}
      </section>

      <section
        id="agentic-readme"
        className="agentic-readme"
        aria-labelledby="agentic-readme-title"
      >
        <header className="agentic-readme-toolbar">
          <FileTextIcon aria-hidden="true" />
          <h2 id="agentic-readme-title">
            {selectedGroup ?? selected.name}{" "}
            <span>/ {selectedGroup ? selected.name : "README.md"}</span>
          </h2>
          <span className="agentic-template-label">Example template</span>
          <a
            className="icon-button"
            href={`data:text/markdown;charset=utf-8,${encodeURIComponent(selected.readme)}`}
            download={selected.name.endsWith(".md") ? selected.name : `${selected.id}-README.md`}
            aria-label={`Download ${selected.name} template`}
            title="Download Markdown template"
          >
            <DownloadIcon aria-hidden="true" />
          </a>
        </header>
        <div className="agentic-distinction" aria-live="polite" aria-atomic="true">
          <h3>How {selected.name} fits in</h3>
          <p>{selected.distinction}</p>
          <a href={selected.source} target="_blank" rel="noreferrer">
            {selected.sourceLabel} <ArrowUpRightIcon aria-hidden="true" />
          </a>
        </div>
        <StructureMarkdown key={selected.id} className="markdown-body">
          {selected.readme}
        </StructureMarkdown>
        <footer className="agentic-readme-footer">
          A starting point for your project. Adapt the names, commands, and configuration to your
          agent app.
        </footer>
      </section>
    </main>
  );
}
