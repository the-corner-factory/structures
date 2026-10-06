import { ArrowDownIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
import { useId, type CSSProperties } from "react";

import { AGENT_EXAMPLES, AGENTIC_TEMPLATES, INSTRUCTION_FILES } from "#/lib/agentic.ts";

const mapNodes = [
  { id: "plugins", label: "Plugins", summary: "Distribute compatible components", tone: "purple" },
  { id: "harness", label: "Harness", summary: "Loop, context, tools & permissions", tone: "blue" },
  {
    id: "mcp-servers",
    label: "MCP servers",
    summary: "Connect external capabilities",
    tone: "amber",
  },
  { id: "hooks", label: "Hooks", summary: "React to lifecycle events", tone: "rose" },
  { id: "agents", label: "Agent", summary: "Reasons with a model", tone: "teal" },
  { id: "tools", label: "Tools", summary: "Perform available operations", tone: "blue" },
  {
    id: "instructions",
    label: "Instructions",
    summary: "Set applicable working guidance",
    tone: "green",
  },
  { id: "skills", label: "Skills", summary: "Provide procedures & resources", tone: "purple" },
  {
    id: "context-md",
    label: "Specs & context",
    summary: "Supply project facts & code",
    tone: "amber",
  },
];

// Fixed coordinates keep this nine-block teaching diagram aligned with its HTML buttons.
const connections = [
  {
    from: "plugins",
    to: "harness",
    label: ["supply", "components to"],
    path: "M270 86 H378",
    x: 325,
    y: 55,
  },
  {
    from: "harness",
    to: "mcp-servers",
    label: ["connects to"],
    path: "M620 86 H728",
    x: 675,
    y: 66,
  },
  { from: "harness", to: "hooks", label: ["triggers"], path: "M400 136 L232 264", x: 302, y: 202 },
  { from: "harness", to: "agents", label: ["runs"], path: "M500 136 V264", x: 500, y: 202 },
  {
    from: "harness",
    to: "tools",
    label: ["executes", "authorized calls to"],
    path: "M600 136 L778 264",
    x: 690,
    y: 196,
  },
  { from: "mcp-servers", to: "tools", label: ["expose"], path: "M850 136 V264", x: 850, y: 202 },
  {
    from: "agents",
    to: "tools",
    label: ["requests", "calls to"],
    path: "M620 316 H728",
    x: 675,
    y: 285,
  },
  {
    from: "instructions",
    to: "agents",
    label: ["orient"],
    path: "M250 496 L398 368",
    x: 318,
    y: 432,
  },
  { from: "skills", to: "agents", label: ["guide"], path: "M500 496 V368", x: 500, y: 432 },
  {
    from: "context-md",
    to: "agents",
    label: ["inform", "when read"],
    path: "M750 496 L602 368",
    x: 682,
    y: 426,
  },
];

export function AgenticMap({
  selected,
  onSelect,
  templates = AGENTIC_TEMPLATES,
}: {
  selected: (typeof AGENTIC_TEMPLATES)[number];
  onSelect: (element: (typeof AGENTIC_TEMPLATES)[number]) => void;
  templates?: typeof AGENTIC_TEMPLATES;
}) {
  const markerId = useId();
  const nodes = mapNodes.map((node) => {
    const element = templates.find((item) => item.id === node.id)!;
    const original = AGENTIC_TEMPLATES.find((item) => item.id === node.id)!;
    return {
      ...node,
      element,
      label: element.name === original.name ? node.label : element.name,
      summary: element.description === original.description ? node.summary : element.description,
    };
  });
  const selectedId =
    INSTRUCTION_FILES.find((file) => file.id === selected.id)?.mapNodeId ??
    (AGENT_EXAMPLES.some((example) => example.id === selected.id) ? "agents" : selected.id);
  const current = nodes.find((node) => node.id === selectedId)!;
  const related = connections.filter(({ from, to }) => from === selectedId || to === selectedId);

  return (
    <div className="agentic-system">
      <div className="agentic-map" role="group" aria-label="Agent system building blocks">
        <svg className="agentic-map-lines" viewBox="0 0 1000 680" aria-hidden="true">
          <defs>
            {["muted", "accent"].map((tone) => (
              <marker
                key={tone}
                id={`${markerId}-${tone}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 Z" fill={`var(--${tone})`} />
              </marker>
            ))}
          </defs>
          {connections.map((connection) => (
            <g
              key={`${connection.from}-${connection.to}`}
              className="agentic-map-connection"
              data-active={related.includes(connection)}
            >
              <path
                d={connection.path}
                markerEnd={`url(#${markerId}-${related.includes(connection) ? "accent" : "muted"})`}
                strokeDasharray={connection.from === "plugins" ? "6 5" : undefined}
              />
              <text x={connection.x} y={connection.y}>
                {connection.label.map((line, index) => (
                  <tspan key={line} x={connection.x} dy={index === 0 ? 0 : 16}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          ))}
        </svg>
        {nodes.map((node, index) => {
          const Icon = node.element.icon;
          const active = selectedId === node.id;
          const nodeTemplates =
            node.id === "agents"
              ? templates.filter((item) => AGENT_EXAMPLES.some(({ id }) => id === item.id))
              : templates.filter((item) =>
                  INSTRUCTION_FILES.some(
                    (file) => file.id === item.id && file.mapNodeId === node.id,
                  ),
                );
          return (
            <div
              key={node.id}
              className="agentic-map-node"
              data-tone={node.tone}
              data-selected={active}
              data-related={related.some(({ from, to }) => from === node.id || to === node.id)}
              style={
                {
                  "--node-left": `${3 + (index % 3) * 35}%`,
                  "--node-top": `${((36 + Math.floor(index / 3) * 230) / 680) * 100}%`,
                } as CSSProperties
              }
            >
              <button
                type="button"
                className="agentic-map-node-select"
                aria-label={node.label}
                aria-pressed={active}
                aria-controls="agentic-map-detail agentic-readme"
                onClick={() => onSelect(node.element)}
              >
                <span className="agentic-map-node-title">
                  <Icon aria-hidden="true" />
                  <strong>{node.label}</strong>
                  {active && <CheckIcon className="agentic-map-check" aria-hidden="true" />}
                </span>
                <span className="agentic-map-node-summary">{node.summary}</span>
              </button>
              {nodeTemplates.length > 0 && (
                <div className="agentic-map-files">
                  {nodeTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="agentic-file-badge"
                      title={template.description}
                      aria-pressed={selected.id === template.id}
                      aria-controls="agentic-readme"
                      onClick={() => onSelect(template)}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="agentic-map-legend">
        <span>
          <i aria-hidden="true" /> Relationship
        </span>
        <span>
          <i className="agentic-map-dashed" aria-hidden="true" /> Compatible component delivery
        </span>
        <span className="agentic-map-hint">Select a block to trace its connections</span>
      </div>
      <section
        id="agentic-map-detail"
        className="agentic-map-detail"
        aria-labelledby="agentic-map-detail-title"
      >
        <div className="agentic-map-detail-copy" aria-live="polite" aria-atomic="true">
          <p className="eyebrow">In this system</p>
          <h3 id="agentic-map-detail-title">{current.label}</h3>
          <p>
            {selected.id === "context-md" &&
            current.element.distinction ===
              AGENTIC_TEMPLATES.find((item) => item.id === "context-md")!.distinction
              ? "Specifications, architecture notes, and source code inform the agent after it reads them. CONTEXT.md records project knowledge, DESIGN.md describes the visual system, and PRODUCT.md explains product goals and user needs."
              : selectedId === "context-md"
                ? selected.distinction
                : current.element.distinction}
          </p>
          <div className="agentic-map-template-links">
            <a href="#agentic-readme">
              Read {selectedId === "context-md" ? `${selected.name} example` : "template"}{" "}
              <ArrowDownIcon aria-hidden="true" />
            </a>
          </div>
        </div>
        <ul className="agentic-map-relations" aria-label={`${current.label} connections`}>
          {related.map(({ from, to, label }) => (
            <li key={`${from}-${to}`}>
              <span>{nodes.find((node) => node.id === from)!.label}</span>{" "}
              <ArrowRightIcon aria-hidden="true" />
              <span>
                {from === "context-md" ? "inform" : label.join(" ")}{" "}
                <strong>{nodes.find((node) => node.id === to)!.label}</strong>
                {from === "context-md" && " when read"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
