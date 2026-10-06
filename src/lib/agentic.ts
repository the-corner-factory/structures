import {
  BookOpenIcon,
  BotIcon,
  FileTextIcon,
  LayersIcon,
  LightbulbIcon,
  MessageSquareIcon,
  NotebookTextIcon,
  PlugIcon,
  ServerIcon,
  WrenchIcon,
  ZapIcon,
} from "lucide-react";

// Highlight contents and capability configuration, not calls or transitive dependencies.
// Conditional links are host extensions or custom content delivery, explained per card.
export const AGENTIC_RELATIONSHIPS: Record<
  string,
  { includes: string[]; conditional?: string[]; description: string }
> = {
  harness: {
    includes: ["plugins", "agents", "mcp-servers", "skills", "instructions", "hooks", "tools"],
    description:
      "Hosts agents and tools, loads instructions and skills, connects MCP servers, and can support plugins and lifecycle hooks.",
  },
  plugins: {
    includes: ["agents", "mcp-servers", "skills", "instructions", "hooks", "tools"],
    description:
      "Can package agent definitions, MCP servers, skills, instructions, hooks, and tools. The host determines which bundled components it loads.",
  },
  agents: {
    includes: ["mcp-servers", "skills", "instructions", "tools"],
    conditional: ["hooks"],
    description:
      "Agent definitions supply instructions and configure skills, tool access, and MCP connections. Agent-scoped hooks are a host extension; the harness executes them. Support also depends on how the agent is installed.",
  },
  "mcp-servers": {
    includes: ["instructions", "tools"],
    conditional: ["skills"],
    description:
      "Expose tools, resources, prompts, and server instructions. A custom server can deliver skill files as resources, but the host must load them; Skills is not a native MCP capability.",
  },
  skills: {
    includes: ["instructions"],
    conditional: ["hooks", "tools"],
    description:
      "Contain instructions, references, assets, and scripts. Host extensions can declare hooks or configure allowed tools. A script does not automatically become a registered tool; an agent or MCP server is configured separately.",
  },
  tools: {
    includes: ["instructions"],
    description:
      "Tool descriptions can include usage instructions alongside an input/output contract. Calling an agent or returning a skill file does not make that agent or skill part of the tool definition.",
  },
  instructions: {
    includes: [],
    description:
      "Contain guidance and context, including prompts and examples. Mentioning an agent, skill, server, hook, or tool does not install or configure that capability.",
  },
  hooks: {
    includes: [],
    conditional: ["instructions"],
    description:
      "Define event handlers executed by the harness. Hosts with prompt-based hooks allow embedded instructions. Calling a tool, contacting an MCP server, or launching an agent is execution, not containment.",
  },
};

export const AGENTIC_ELEMENTS = [
  {
    id: "harness",
    name: "Harness",
    kind: "Runtime",
    icon: LayersIcon,
    description: "Runs the agent loop. Manages models, context, tool execution, and permissions.",
    distinction:
      "The harness is the surrounding software. An agent pursues a goal inside it; the model supplies the reasoning.",
    source: "https://www.anthropic.com/engineering/managed-agents",
    sourceLabel: "How an agent harness works",
    readme: `# Project workspace harness

Runs a coding agent in a local project workspace.

## Responsibilities

- Load the task, project instructions, and relevant context.
- Send the conversation and available tools to the model.
- Execute permitted tool calls and return their results to the model.
- Continue until the task is complete, blocked, or reaches a configured limit.

## Runtime choices

| Setting | Example |
| --- | --- |
| Workspace | Current project directory |
| Tools | Read files, edit files, run project checks |
| Permissions | Workspace edits allowed; publishing requires approval |
| Limits | Set a time or cost budget for each run |
| Session state | Save progress and tool results for resuming work |

## Completion

Report the changed files, checks run, and any remaining work. Keep credentials outside prompts and logs.
`,
  },
  {
    id: "plugins",
    name: "Plugins",
    kind: "Package",
    icon: PlugIcon,
    description:
      "Install reusable packages that extend the agent. Plugins can add agents, MCP servers, skills, instructions, hooks and tools.",
    distinction:
      "A plugin distributes capabilities together. Its contents do the work; supported contents and installation formats depend on the host.",
    source: "https://code.claude.com/docs/en/plugins",
    sourceLabel: "Plugin packaging example",
    readme: `# Team development plugin

A reusable package for the team's review workflow.

## Included capabilities

| Component | Purpose |
| --- | --- |
| Review agent | Inspect changes and report defects |
| Review skill | Follow the team's review checklist |
| Issue tracker MCP connection | Look up acceptance criteria |
| Validation hook | Run a check at a configured lifecycle event |

## Installation

Install through your agent app's supported plugin mechanism. Configure the issue tracker connection and grant only the access the workflow needs.

## Usage

Ask the agent to review a change against its linked issue. Enable only the bundled capabilities needed for the project.

## Maintenance

Document the supported host version, required configuration, and changes in each release. Keep secrets outside the package.
`,
  },
  {
    id: "agents",
    name: "Agents",
    kind: "Role",
    icon: BotIcon,
    description:
      "Create specialized agents for focused development tasks. Control their instructions, tools, and behavior.",
    distinction:
      "An agent decides what to do next. A skill supplies a procedure, and a tool performs an individual operation.",
    source: "https://code.claude.com/docs/en/sub-agents",
    sourceLabel: "Specialized agent definitions",
    readme: `# Code review agent

Review a proposed change for correctness, security, and maintainability.

## Inputs

- The diff and the intended behavior.
- Relevant project instructions and test commands.

## Working approach

1. Read the changed code and its callers.
2. Trace failure cases and check assumptions against the implementation.
3. Run focused checks using the available tools.

## Tools and scope

Read files, search code, and run checks. Recommend fixes; leave source edits to the implementation task.

## Output

For each actionable finding, include its location, impact, and a concrete correction. If none are found, state what was reviewed and any verification gaps.
`,
  },
  {
    id: "mcp-servers",
    name: "MCP Servers",
    kind: "Connection",
    icon: ServerIcon,
    description:
      "Connect agents to tools, resources, and reusable prompts through MCP servers. Servers can also deliver instructions and skill content.",
    distinction:
      "MCP is the connection protocol. A server can expose several capabilities; a tool is one callable operation, which can also exist without MCP.",
    source: "https://modelcontextprotocol.io/docs/learn/server-concepts",
    sourceLabel: "MCP server concepts",
    readme: `# Project knowledge MCP server

Connect an agent app to project documentation and issue data.

## Exposed capabilities

| Type | Example | Purpose |
| --- | --- | --- |
| Tool | search_docs(query) | Search the knowledge base |
| Resource | Project overview | Provide reference content |
| Prompt | Summarize an issue | Supply a reusable prompt template |

## Connection

Document the local launch command or remote endpoint, supported transport, and authentication setup. Add the server through your host's MCP configuration.

## Access

Start with read-only access. Keep credentials in the host's secret storage and enforce authorization on the server.

## Verification

Connect from an MCP client, list the capabilities, and run a sample documentation search. Return a clear error when authentication fails or a resource is unavailable.
`,
  },
  {
    id: "skills",
    name: "Skills",
    kind: "Workflow",
    icon: LightbulbIcon,
    description:
      "Add reusable knowledge and workflows for specialized tasks. Agents load relevant skills when needed.",
    distinction:
      "A skill supplies instructions and supporting files for a task. The host controls execution and permissions; its extensions may configure tools, hooks, or an agent to run the skill.",
    source: "https://agentskills.io/home",
    sourceLabel: "Agent Skills format",
    readme: `# Review changes skill

A repeatable checklist for reviewing a code change.

## When to use

Use when someone requests a code review or asks whether a change is ready to merge.

## Example SKILL.md

Save this in a skill directory supported by your agent app.

\`\`\`markdown
---
name: review-changes
description: Review a code diff for bugs and missing validation. Use for code review requests.
---

# Review changes

1. Read the diff, project instructions, and affected callers.
2. Check behavior, edge cases, and access controls.
3. Run the relevant project checks.
4. Report actionable findings with file locations and impact.
\`\`\`

## Supporting material

Add reference documents or scripts only when the workflow needs them. Link to them from SKILL.md so the agent knows when to load them.
`,
  },
  {
    id: "instructions",
    name: "Instructions",
    kind: "Guidance",
    icon: BookOpenIcon,
    description:
      "Define guidance that shapes how agents work. Apply it across a workspace or keep it in your user profile.",
    distinction:
      "Instructions are the guidance itself. AGENTS.md is one place to store it; a skill packages guidance for a particular task.",
    source: "https://agents.md/",
    sourceLabel: "Project instruction examples",
    readme: `# Team working instructions

Shared expectations for work in this project.

## Scope

Apply these conventions to project changes. Store them in a location your agent app reads, such as its project instruction settings or AGENTS.md.

## Implementation

- Read the relevant code before editing.
- Reuse existing helpers and dependencies.
- Keep changes focused on the requested behavior.
- Preserve accessibility and validate external inputs.

## Verification

Run the checks relevant to the change. Report failing or unavailable checks accurately.

## Communication

Summarize the result, verification, and unresolved decisions. Reference changed files when useful.

## Permissions

Use the host's permission controls to restrict actions. Written guidance alone is not an access-control mechanism.
`,
  },
  {
    id: "tools",
    name: "Tools",
    kind: "Action",
    icon: WrenchIcon,
    description:
      "Review the tools available to the active agent. Enable or disable configurable tool groups.",
    distinction:
      "A tool defines an operation with inputs and a result. The agent chooses when to call it; the harness executes it, subject to permissions.",
    source: "https://modelcontextprotocol.io/docs/learn/server-concepts",
    sourceLabel: "Callable tools and their schemas",
    readme: `# Search project docs tool

Find relevant passages in the project's documentation.

## Contract

| Field | Description |
| --- | --- |
| Name | search_docs |
| Input | A nonempty query string |
| Output | Matching titles, paths, and excerpts |
| Side effects | None; read-only search |

## Example call

\`\`\`json
{ "query": "How is authentication configured?" }
\`\`\`

## Behavior

Validate the query and search only authorized project documents. Return an empty result list when nothing matches, and a clear error when the index cannot be reached.

## Integration

Expose the operation as a native host tool or through an MCP server. Describe its inputs and results so the agent knows when to use it.
`,
  },
  {
    id: "hooks",
    name: "Hooks",
    kind: "Automation",
    icon: ZapIcon,
    description:
      "Trigger actions at key points in the agent lifecycle. Depending on the host, hooks can run commands, evaluate prompts, call MCP tools, or launch agents.",
    distinction:
      "Hooks react to events in the harness. Instructions ask the agent to follow guidance; a hook is invoked by the host at a configured event.",
    source: "https://code.claude.com/docs/en/hooks",
    sourceLabel: "Hook lifecycle and configuration example",
    readme: `# Post-edit validation hook

Run a project check after an edit completes.

## Trigger

Use the host's supported post-tool event and match its file-editing tools. Event names and matching rules are host-specific.

## Handler

Run from the project root. For a project with a lint script, the command could be:

\`\`\`sh
pnpm lint
\`\`\`

## Failure behavior

Return the check output to the agent and report a nonzero exit status when validation fails. A post-edit hook reports a problem after the edit; it does not undo the change.

## Configuration

Document the event, matcher, working directory, and timeout. Use the host's documented rules if a pre-action hook must block execution.

## Verification

Make one valid edit and one intentionally invalid edit in a disposable workspace. Confirm that the hook runs and exposes the failure.
`,
  },
];

export const AGENT_PROMPT = {
  id: "prompt",
  name: "Prompt",
  kind: "Input",
  icon: MessageSquareIcon,
  description: "The request you give an agent.",
  distinction:
    "A prompt is the input you give an agent. It can contain instructions, a question, context, examples, or data. The agent uses that input to decide what to do next.",
  source: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview",
  sourceLabel: "Prompt engineering overview",
  readme: `# Prompt

A prompt starts or continues an interaction with an agent. It tells the agent what you need and can provide the information needed to do the work.

## Prompt, instructions, and context

| Concept | Purpose | Example |
| --- | --- | --- |
| Prompt | The input given to the agent | Review this change. |
| Instructions | Guidance on how to work | Prioritize correctness and accessibility. |
| Context | Background that helps with the task | This project uses React 19. |

A single prompt can include all three. Project instructions such as AGENTS.md can also provide guidance across many tasks.

## Example prompt

\`\`\`text
Review the proposed login-page change.

Context: this project uses React 19, and the page must work with a keyboard.
Instructions: check correctness and accessibility. Do not edit files.
Output: list actionable findings with file locations and suggested fixes.
\`\`\`

## Writing a useful prompt

State the task, include relevant context, and describe the expected result. Add examples or constraints when they help clarify what you need.
`,
};

export const AGENT_EXAMPLES = [
  AGENT_PROMPT,
  {
    id: "artifacts",
    name: "Artifacts",
    kind: "Output",
    icon: FileTextIcon,
    description: "Self-contained outputs you can edit, reuse, and share beyond the conversation.",
    distinction:
      "An artifact is a deliverable created during the work. A prompt requests it; the agent produces it using the host's capabilities. Claude displays artifacts beside the conversation for further editing and reuse.",
    source:
      "https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them",
    sourceLabel: "Claude's guide to artifacts",
    readme: `# Artifacts

An artifact is a self-contained result of AI-assisted work, such as a document, diagram, design, presentation, dashboard, or small interactive tool.

## When to use one

Ask for an artifact when the result needs to stand on its own and you expect to revisit, revise, or share it.

## In Claude

Artifacts open beside the conversation. Describe the changes you want, then share or export the result using the available controls. Supported templates also allow direct editing.

## Example request

\`\`\`text
Create an onboarding checklist artifact for this project.
Include setup steps, verification commands, and links to the relevant docs.
Keep it understandable without the chat history.
\`\`\`

Review the result, ask for revisions, and reuse it when it is ready. Artifact features and formats depend on the host.
`,
  },
];

export const INSTRUCTION_FILES = [
  {
    id: "agents-md",
    mapNodeId: "instructions",
    name: "AGENTS.md",
    kind: "Project instructions",
    icon: FileTextIcon,
    description: "A conventional Markdown file for project guidance, commands, and coding rules.",
    distinction:
      "AGENTS.md guides agents working in a repository; it does not define or launch an agent. Discovery and directory scope depend on the host.",
    source: "https://agents.md/",
    sourceLabel: "AGENTS.md specification and examples",
    readme: `# AGENTS.md

## Project

A TypeScript web application. Keep changes focused and follow patterns in neighboring files.

## Commands

- Install dependencies: pnpm install
- Start development: pnpm dev
- Check code: pnpm lint
- Run tests: pnpm test
- Build: pnpm build

## Conventions

- Reuse existing components before adding new ones.
- Validate inputs at system boundaries.
- Keep interactive controls keyboard-accessible.
- Do not edit generated files directly.

## Before finishing

Run relevant checks and summarize the changes. State any checks that could not run.

## Project context

Read CONTEXT.md for current architecture and decisions. Treat its progress notes as background; verify them against the code.
`,
  },
  {
    id: "context-md",
    mapNodeId: "context-md",
    name: "CONTEXT.md",
    kind: "Project knowledge",
    icon: NotebookTextIcon,
    description:
      "Record architecture, decisions, and current state so work can resume with context.",
    distinction:
      "Here, CONTEXT.md holds project facts and handoff notes, while AGENTS.md holds working guidance. CONTEXT.md is a project convention: explicitly reference or load it.",
    source: "https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents",
    sourceLabel: "Using artifacts to carry context between sessions",
    readme: `# CONTEXT.md

## Project overview

A documentation website for exploring project organization standards.

## Architecture

- Routes define the public pages.
- Shared components render navigation and Markdown.
- Local content supplies the examples shown in the interface.

## Decisions

- Reuse the existing Markdown renderer for all example documents.
- Keep public documentation available without an account.

## Current state

- Completed: initial page layout and navigation.
- Next: review the example content with the team.
- Open question: which examples should be added next?

## Handoff

- Last verified: [date and commit].
- Checks run: [commands and results].
- Known limitations: [remaining issues or assumptions].

Keep these notes current and link to the source files behind each decision. Load this file explicitly or reference it from the project's agent instructions.
`,
  },
  {
    id: "design-md",
    mapNodeId: "context-md",
    name: "DESIGN.md",
    kind: "Design context",
    icon: NotebookTextIcon,
    description:
      "Describe the visual system: colors, typography, spacing, components, and interaction states.",
    distinction:
      "Here, DESIGN.md gives agents the visual language and UI rules to follow when building screens. PRODUCT.md supplies product goals; CONTEXT.md records architecture. Reference or load DESIGN.md before UI work; discovery depends on the host.",
    source:
      "https://github.com/google-labs-code/stitch-skills/blob/main/plugins/stitch-utilities/skills/design-md/SKILL.md",
    sourceLabel: "Google Stitch's DESIGN.md guidance",
    readme: `# DESIGN.md

## Visual theme

A documentation library with a quiet interface that keeps examples easy to scan and read. This is an illustrative design brief; adapt it to your project's existing visual system.

## Colors and roles

| Role | Example value | Usage |
| --- | --- | --- |
| Background | #FFFFFF | Reading surface |
| Text | #1F2328 | Headings and body copy |
| Accent | #0969DA | Links and selected controls |

## Typography

- Use the project's existing sans-serif font for navigation and prose.
- Use a monospace font for code and filenames.
- Keep long text readable with clear heading levels and comfortable line spacing.

## Components and states

- Reuse existing buttons, cards, inputs, and Markdown styles.
- Make selected, hover, focus, loading, and error states clear.
- Preserve keyboard access, visible focus, and accessible contrast in both themes.

## Layout

Use the existing spacing scale. Keep related controls together, allow filename badges to wrap, and stack columns on narrow screens.

## References and maintenance

Link to the project's token definitions, stylesheet, and representative components. Keep this brief aligned with them, and load it explicitly or reference it from AGENTS.md before UI changes.
`,
  },
  {
    id: "product-md",
    mapNodeId: "context-md",
    name: "PRODUCT.md",
    kind: "Product context",
    icon: FileTextIcon,
    description:
      "Explain the product's purpose, target users, key features, scope, and success criteria.",
    distinction:
      "PRODUCT.md gives agents the product vision and user needs behind implementation decisions. Keep it focused on what the product does and why; link to DESIGN.md for UI rules and CONTEXT.md for architecture. Reference or load it explicitly; the filename alone does not guarantee inclusion.",
    source: "https://code.visualstudio.com/docs/agents/guides/context-engineering-guide",
    sourceLabel: "VS Code's product context guidance",
    readme: `# PRODUCT.md

## Purpose

Help developers understand and share project organization standards through browsable examples.

## Users and needs

- Developers looking for an appropriate project structure.
- Teams sharing conventions during onboarding and code review.
- Maintainers keeping examples and explanations accurate.

## Key features

- Browse folder structures and read the documentation for each entry.
- Explore issue conventions, branch strategies, and agent concepts.
- Share links to selected examples and download reusable templates.

## Scope

Provide educational examples and reference material. Running agents and managing live issues are outside this product's scope.

## Success criteria

- A visitor can find an example and understand when to use it.
- Shared links restore the selected example.
- Public content works without an account and is accessible with a keyboard.

## Open questions

Which user needs and examples should the next release address? Record confirmed decisions here and track feature-specific acceptance criteria in the corresponding issue or specification.

Keep this overview concise and current. Load it explicitly or reference it from AGENTS.md so the agent can use it when planning features.
`,
  },
];

export const AGENTIC_TEMPLATES = [...AGENTIC_ELEMENTS, ...AGENT_EXAMPLES, ...INSTRUCTION_FILES];

export interface AgenticSearch {
  view?: "map" | "cards";
  template?: string;
}

export function validateAgenticSearch(search: Record<string, unknown>): AgenticSearch {
  return {
    view: search.view === "map" || search.view === "cards" ? search.view : undefined,
    template: AGENTIC_TEMPLATES.find((template) => template.id === search.template)?.id,
  };
}
