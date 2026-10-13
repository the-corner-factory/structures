import { ArrowDownIcon, ArrowRightIcon, CheckIcon, FolderIcon } from "lucide-react";
import { useId, type CSSProperties } from "react";

import {
  AGENT_EXAMPLES,
  AGENTIC_TEMPLATES,
  INSTRUCTION_FILES,
  SCOPED_EXAMPLES,
} from "#/lib/agentic.ts";

const mapNodes = [
  {
    id: "plugins",
    label: "Plugins",
    summary: "Distribute compatible components",
    tone: "purple",
  },
  {
    id: "harness",
    label: "Harness",
    summary: "Loop, context, tools & permissions",
    tone: "blue",
  },
  {
    id: "mcp-servers",
    label: "MCP servers",
    summary: "Connect external capabilities",
    tone: "amber",
  },
  {
    id: "hooks",
    label: "Hooks",
    summary: "React to lifecycle events",
    tone: "rose",
  },
  {
    id: "agents",
    label: "Agent",
    summary: "Reasons with a model",
    tone: "teal",
  },
  {
    id: "tools",
    label: "Tools",
    summary: "Perform available operations",
    tone: "blue",
  },
  {
    id: "skills",
    label: "Project skills",
    summary: "Project workflows & resources",
    tone: "purple",
  },
  {
    id: "instructions",
    label: "Instructions",
    summary: "Set applicable working guidance",
    tone: "green",
  },
  {
    id: "context-md",
    label: "Specs & context",
    summary: "Supply project facts & code",
    tone: "amber",
  },
];

const categoryTones: Record<string, string> = {
  Agents: "teal",
  "MCP servers": "amber",
  Skills: "purple",
  Instructions: "green",
  Hooks: "rose",
  Tools: "blue",
  Resources: "amber",
  Prompts: "amber",
};

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
  {
    from: "harness",
    to: "hooks",
    label: ["triggers"],
    path: "M400 136 L232 264",
    x: 302,
    y: 202,
  },
  {
    from: "harness",
    to: "agents",
    label: ["runs"],
    path: "M500 136 V264",
    x: 500,
    y: 202,
  },
  {
    from: "harness",
    to: "tools",
    label: ["executes", "authorized calls to"],
    path: "M600 136 L778 264",
    x: 690,
    y: 196,
  },
  {
    from: "mcp-servers",
    to: "tools",
    label: ["expose"],
    path: "M850 136 V264",
    x: 850,
    y: 202,
  },
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
    path: "M500 496 V428",
    compactPath: "M500 496 V368",
    x: 500,
    y: 450,
    compactY: 420,
  },
  {
    from: "context-md",
    to: "agents",
    label: ["inform", "when read"],
    path: "M750 496 L602 428",
    compactPath: "M750 496 L602 368",
    x: 682,
    y: 446,
    compactY: 416,
  },
  {
    from: "skills",
    to: "agents",
    label: ["guide"],
    path: "M250 496 L398 428",
    compactPath: "M250 496 L398 368",
    x: 318,
    y: 450,
    compactY: 420,
  },
];

export function AgenticMap({
  selected,
  onSelect,
  templates = AGENTIC_TEMPLATES,
  detailed = false,
}: {
  selected: (typeof AGENTIC_TEMPLATES)[number];
  onSelect: (element: (typeof AGENTIC_TEMPLATES)[number]) => void;
  templates?: typeof AGENTIC_TEMPLATES;
  detailed?: boolean;
}) {
  const markerId = useId();
  const scopedExample = SCOPED_EXAMPLES.find((example) => example.id === selected.id);
  const origin = selected.id === "skills" ? "project" : scopedExample?.origin;
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
    scopedExample?.mapNodeId ??
    INSTRUCTION_FILES.find((file) => file.id === selected.id)?.mapNodeId ??
    (AGENT_EXAMPLES.some((example) => example.id === selected.id) ? "agents" : selected.id);
  const current = nodes.find((node) => node.id === selectedId)!;
  const deliveryTarget =
    scopedExample?.label === "Hooks"
      ? "hooks"
      : scopedExample?.label === "MCP servers"
        ? "mcp-servers"
        : "agents";
  const related = connections.filter(({ from, to }) =>
    scopedExample && (selectedId === "plugins" || selectedId === "harness")
      ? (from === "harness" && to === deliveryTarget) ||
        (scopedExample.origin === "plugin" && from === "plugins")
      : from === selectedId || to === selectedId,
  );
  const detailLabel = origin ? selected.name : current.label;

  const nodeElements = nodes.map((node, index) => {
    const Icon = node.element.icon;
    const active = selectedId === node.id;
    const scopedTemplates = SCOPED_EXAMPLES.filter((example) => example.mapNodeId === node.id).map(
      (example) => ({ ...example, template: templates.find((item) => item.id === example.id)! }),
    );
    const nodeTemplates =
      node.id === "agents"
        ? templates.filter((item) => AGENT_EXAMPLES.some(({ id }) => id === item.id))
        : templates.filter((item) =>
            INSTRUCTION_FILES.some((file) => file.id === item.id && file.mapNodeId === node.id),
          );
    return (
      <div
        key={node.id}
        className="agentic-map-node"
        data-node={node.id}
        data-tone={active && scopedExample ? categoryTones[scopedExample.label] : node.tone}
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
          aria-pressed={active && !scopedExample}
          aria-controls="agentic-map-detail agentic-readme"
          onClick={() => onSelect(node.element)}
        >
          <span className="agentic-map-node-title">
            <Icon aria-hidden="true" />
            <strong>
              {node.id === "skills" && node.label === "Project skills" ? "Skills" : node.label}
            </strong>
            {active && <CheckIcon className="agentic-map-check" aria-hidden="true" />}
          </span>
          <span className="agentic-map-node-summary">{node.summary}</span>
        </button>
        {scopedTemplates.length > 0 && (
          <div className="agentic-scoped-templates">
            {scopedTemplates.map(({ id, icon: ExampleIcon, label, support, template }) => (
              <button
                key={id}
                type="button"
                className="icon-button agentic-scoped-badge"
                data-category={label}
                data-conditional={Boolean(support)}
                title={support ? `${template.name}: ${support}` : template.name}
                aria-label={template.name}
                aria-pressed={selected.id === id}
                aria-controls="agentic-map-detail agentic-readme"
                onClick={() => onSelect(template)}
              >
                {detailed ? (
                  <ExampleIcon aria-hidden="true" />
                ) : (
                  <span className="agentic-map-dot" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}
        {detailed && nodeTemplates.length > 0 && (
          <div className="agentic-map-files">
            {nodeTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                className="agentic-file-badge"
                title={`${template.name}: ${template.description}`}
                aria-label={template.name}
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
  });

  return (
    <div className="agentic-system">
      <div
        className="agentic-map"
        data-detailed={detailed}
        role="group"
        aria-label="Agent system building blocks"
      >
        <svg className="agentic-map-lines" viewBox="0 0 1000 680" aria-hidden="true">
          <path
            className="agentic-map-project-outline"
            d="M14 452 Q14 440 26 440 H136 Q144 440 150 448 L160 462 Q164 468 172 468 H974 Q986 468 986 480 V608 Q986 620 974 620 H26 Q14 620 14 608 Z"
          />
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
                d={detailed ? connection.path : (connection.compactPath ?? connection.path)}
                markerEnd={`url(#${markerId}-${related.includes(connection) ? "accent" : "muted"})`}
                strokeDasharray={connection.from === "plugins" ? "6 5" : undefined}
              />
              <text
                x={connection.x}
                y={detailed ? connection.y : (connection.compactY ?? connection.y)}
              >
                {connection.label.map((line, index) => (
                  <tspan key={line} x={connection.x} dy={index === 0 ? 0 : 16}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          ))}
        </svg>
        {nodeElements.slice(0, 6)}
        <div className="agentic-map-project" role="group" aria-labelledby={`${markerId}-project`}>
          <div className="agentic-map-project-heading">
            <span className="agentic-map-project-title" id={`${markerId}-project`}>
              <FolderIcon aria-hidden="true" />
              <strong>Project</strong>
            </span>
            <span className="agentic-map-project-caption">Owned by this project</span>
          </div>
          {nodeElements.slice(6)}
        </div>
      </div>
      <div className="agentic-map-legend">
        <span>
          <i aria-hidden="true" /> Relationship
        </span>
        <span>
          <i className="agentic-map-dashed" aria-hidden="true" /> Compatible component delivery
        </span>
        <span className="agentic-map-hint">
          {detailed
            ? "Select a block or badge. Dashed badges require host or extension support."
            : "Select a block or colored dot to explore its contents."}
        </span>
      </div>
      <section
        id="agentic-map-detail"
        className="agentic-map-detail"
        aria-labelledby="agentic-map-detail-title"
      >
        <div className="agentic-map-detail-copy" aria-live="polite" aria-atomic="true">
          <div className="agentic-map-detail-heading">
            <h3 id="agentic-map-detail-title">{detailLabel}</h3>
            {origin && (
              <span className="agentic-origin" data-category={scopedExample?.label}>
                Origin: {origin}
              </span>
            )}
          </div>
          <p>
            {scopedExample?.support && (
              <>
                <strong>{scopedExample.support}</strong>{" "}
              </>
            )}
            {origin
              ? selected.distinction
              : selected.id === "context-md" &&
                  current.element.distinction ===
                    AGENTIC_TEMPLATES.find((item) => item.id === "context-md")!.distinction
                ? "Specifications, architecture notes, and source code inform the agent after it reads them. GLOSSARY.md defines shared terminology, DESIGN.md describes the visual system, and PRODUCT.md explains product goals and user needs."
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
        <ul className="agentic-map-relations" aria-label={`${detailLabel} connections`}>
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
