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
// Conditional links require host or protocol extensions, explained per card.
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
    includes: ["agents", "mcp-servers", "instructions", "hooks", "tools"],
    description:
      "Can package agent definitions, MCP servers, plugin skills, instructions, hooks, and tools. Plugin skills travel with the package; project skills live in the repository. The host determines which bundled components it loads.",
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
      "Expose tools, resources, prompts, and server instructions. The optional MCP Skills extension adds skill discovery and delivery; both the server and client must support it for skill activation.",
  },
  skills: {
    includes: ["instructions"],
    conditional: ["hooks", "tools"],
    description:
      "Contain instructions, references, assets, and scripts. Host extensions can declare hooks or configure allowed tools. The MCP Skills extension also permits nested skill directories, with separate activation. A script does not automatically become a registered tool.",
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
    name: "Project skills",
    kind: "Workflow",
    icon: LightbulbIcon,
    description:
      "Store project workflows in the repository and share them with its contributors. Agents load relevant skills when needed.",
    distinction:
      "Project skills are stored in this repository and versioned alongside the code they describe. Like plugin and harness skills, they supply procedures and resources; the harness controls loading, execution, and permissions.",
    source: "https://agentskills.io/home",
    sourceLabel: "Agent Skills format",
    readme: `# Review changes skill

A repeatable checklist for reviewing a code change.

## When to use

Use when someone requests a code review or asks whether a change is ready to merge.

## Example SKILL.md

Save this in the repository's skill directory supported by your agent app, and commit it so contributors can use the same workflow.

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

## Example skill collections

- [Matt Pocock](https://github.com/mattpocock/skills)
- [pstack](https://github.com/cursor/plugins/tree/main/pstack)
- [Addy Osmani](https://github.com/addyosmani/agent-skills)
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

export const SCOPED_EXAMPLES = [
  {
    id: "plugin-skills",
    mapNodeId: "plugins",
    origin: "plugin",
    label: "Skills",
    name: "Plugin skills",
    kind: "Workflow",
    icon: LightbulbIcon,
    description: "Procedures and resources packaged with a plugin.",
    distinction:
      "Plugin skills are packaged and maintained with a plugin. Their availability follows where that plugin is installed and enabled, which may be a project or a broader setup. Origin does not imply loading priority.",
    source: "https://code.claude.com/docs/en/skills#choose-where-skills-load",
    sourceLabel: "Skill installation scopes in Claude Code",
    readme: `# Release checklist skill

A repeatable release review distributed with a development plugin.

## Origin and availability

Bundle this skill with the plugin using your host's supported package layout. The plugin's installation and enablement determine where it is available. Keep its references and scripts in the package, and update them with the plugin.

## Example SKILL.md

\`\`\`markdown
---
name: release-checklist
description: Check whether a project is ready for a release. Use for release preparation.
---

# Release checklist

1. Read the project's contribution and release instructions.
2. Check the proposed version, changelog, and uncommitted changes.
3. Run the required project checks.
4. Report readiness and remaining work before publishing.
\`\`\`

## Loading

Plugin, harness, and project skills use the same skill concept. The host decides how it discovers them, resolves name conflicts, and grants execution permissions.
`,
  },
  {
    id: "harness-skills",
    mapNodeId: "harness",
    origin: "harness",
    label: "Skills",
    name: "Harness skills",
    kind: "Workflow",
    icon: LightbulbIcon,
    description: "Reusable workflows configured directly for your harness.",
    distinction:
      "Harness skills are configured directly for your agent environment and reused across projects. They may be provided by the host or installed in its user-level skill collection. The host controls their availability and loading priority.",
    source: "https://code.claude.com/docs/en/skills#choose-where-skills-load",
    sourceLabel: "Skill installation scopes in Claude Code",
    readme: `# Code review skill

A review workflow you bring into different projects through your harness.

## Origin and availability

Install this in the user-level skill collection supported by your agent app. Keep project-specific commands and conventions in the repository, and read them when applying this workflow.

## Example SKILL.md

\`\`\`markdown
---
name: code-review
description: Review changes for correctness and missing coverage. Use for code review requests.
---

# Code review

1. Read the task, diff, and applicable project instructions.
2. Trace affected callers and check failure cases.
3. Run the project's relevant checks.
4. Report actionable findings with locations and impact.
\`\`\`

## Loading

Supported locations and availability vary by host. A skill's origin describes where it comes from; it does not grant permissions or establish a universal precedence over plugin or project skills.
`,
  },
  {
    id: "plugin-instructions",
    mapNodeId: "plugins",
    origin: "plugin",
    label: "Instructions",
    name: "Plugin instructions",
    kind: "Guidance",
    icon: BookOpenIcon,
    description: "Guidance packaged with a plugin and loaded through its supported components.",
    distinction:
      "Plugin instructions explain how to use the plugin's capabilities. They can live in a bundled skill or another component the host supports. Installing a plugin does not make every instruction file active; the harness decides what to load and when.",
    source: "https://developers.openai.com/plugins/build/plugins",
    sourceLabel: "Plugin packaging and skill instructions",
    readme: `# Plugin instructions

Guidance distributed and maintained with a plugin, such as rules for using its tools or following its workflows.

## Where they live

Put guidance in a component your host loads. For example, a Codex plugin can include workflow instructions in a bundled skill's SKILL.md. Other hosts may support instructions in agent definitions or their own configuration formats.

An arbitrary instructions.md or AGENTS.md file in a plugin is not guaranteed to load. Follow the host's documented package layout and loading rules.

## Example guidance

The following could be included in an issue-tracker plugin's skill:

- Read the requested issue and its latest comments before proposing a change.
- Use the connected tracker's existing labels and statuses.
- Preserve the user's intent and cite the issue that supports your recommendation.
- Only update the tracker when the user has requested that action.

## When they apply

The plugin must be available, and the component containing the guidance must be loaded. Skill instructions normally apply when that skill is selected for a task; they are not automatically global rules for every conversation.

## How they relate to other instructions

Plugin is the origin of the guidance, not an instruction priority. The harness determines scope and precedence. Plugin instructions do not grant permissions or replace applicable project guidance.
`,
  },
  {
    id: "harness-instructions",
    mapNodeId: "harness",
    origin: "harness",
    label: "Instructions",
    name: "Harness instructions",
    kind: "Guidance",
    icon: BookOpenIcon,
    description:
      "Working guidance supplied by your agent environment or configured across projects.",
    distinction:
      "Harness instructions set working expectations for the agent environment. They include host-provided guidance and user-wide preferences loaded by the harness. Project instructions add repository-specific guidance; the host determines how their scopes and priorities interact.",
    source: "https://learn.chatgpt.com/docs/agent-configuration/agents-md",
    sourceLabel: "Global and project instructions in Codex",
    readme: `# Harness instructions

Guidance supplied by the agent environment or configured there for use across projects.

## Where they live

The harness provides its own operating instructions and may offer user-wide instruction settings or files. For example, Codex reads global guidance from ~/.codex/AGENTS.md by default, subject to its override and configuration rules.

Keep repository-specific commands and conventions in the project's own AGENTS.md or equivalent. The harness loads those too, but their origin remains the project.

## Example user-wide guidance

- Read the project's instructions before changing files.
- Reuse the project's existing components and dependencies.
- Preserve unrelated working-tree changes.
- Explain the result, the checks performed, and any remaining limitations.

## When they apply

User-wide guidance can apply across repositories where the harness loads it. Unlike a task-specific skill, it supplies general working expectations without needing that skill to be selected.

## Scope and priority

Host-provided instructions and user preferences can have different priorities even though both come through the harness. Follow the host's instruction hierarchy and discovery rules; the origin label alone does not establish precedence.

Instructions guide the agent. Tool permissions and lifecycle hooks are configured separately; writing a rule does not install a hook or grant access to a tool.
`,
  },
  {
    id: "plugin-agents",
    mapNodeId: "plugins",
    origin: "plugin",
    label: "Agents",
    name: "Plugin agents",
    kind: "Role",
    icon: BotIcon,
    support: "Requires a host that loads plugin agent definitions.",
    description: "Specialized agent definitions distributed with a plugin.",
    distinction:
      "A plugin can package an agent's role and instructions. The harness discovers the definition and runs the agent; packaging it does not create a running agent.",
    source: "https://code.claude.com/docs/en/plugins-reference",
    sourceLabel: "Plugin agent definitions",
    readme: `# Plugin agents

Bundle specialized roles with a reusable plugin.

## Example package

In Claude Code, an agents/reviewer.md file can define a review agent with its own description, instructions, and tool selection. The harness makes it available after the plugin is enabled.

## Host limits

Follow the destination host's plugin format. Claude Code plugin agents do not load agent-level hooks, mcpServers, or permissionMode fields; package supported hooks and MCP connections at the plugin root instead.
`,
  },
  {
    id: "plugin-hooks",
    mapNodeId: "plugins",
    origin: "plugin",
    label: "Hooks",
    name: "Plugin hooks",
    kind: "Automation",
    icon: ZapIcon,
    support: "Requires a host that loads plugin hooks.",
    description: "Lifecycle event handlers packaged with a plugin.",
    distinction:
      "A plugin can ship hook configuration and handler scripts. The harness registers supported events and executes their handlers when those events occur.",
    source: "https://code.claude.com/docs/en/plugins-reference",
    sourceLabel: "Plugin hook configuration",
    readme: `# Plugin hooks

Distribute an event-driven check with a development plugin.

## Example

A Claude Code plugin can include hooks/hooks.json and a scripts/check.sh handler. Register the handler for a supported lifecycle event and resolve its path from the plugin's installation directory.

## Execution

The harness decides when the handler runs and which permissions apply. An instruction that says “run checks” does not itself register a hook. Document the event, matcher, timeout, and failure behavior for the chosen host.
`,
  },
  {
    id: "plugin-mcp-servers",
    mapNodeId: "plugins",
    origin: "plugin",
    label: "MCP servers",
    name: "Plugin MCP configuration",
    kind: "Connection",
    icon: ServerIcon,
    support: "Requires a host that loads plugin MCP configuration.",
    description: "MCP connection definitions distributed with a plugin.",
    distinction:
      "A plugin can package configuration for local or remote MCP servers. The configuration tells the harness how to connect; a remote server's implementation remains outside the plugin.",
    source: "https://code.claude.com/docs/en/plugins-reference",
    sourceLabel: "MCP servers in plugins",
    readme: `# Plugin MCP configuration

Ship a connection alongside the workflows that use it.

## Example

A Claude Code plugin can include .mcp.json defining a local documentation server's launch command or a remote server's URL. A local implementation may also be bundled in the package.

## Installation

Document required environment variables and authentication. The user still needs access to the service, and the harness controls connection setup and tool permissions. Keep credentials outside the plugin.
`,
  },
  {
    id: "agent-instructions",
    mapNodeId: "agents",
    origin: "agent definition",
    label: "Instructions",
    name: "Agent instructions",
    kind: "Guidance",
    icon: BookOpenIcon,
    description: "The role, boundaries, and working approach in an agent definition.",
    distinction:
      "An agent definition can contain instructions for that agent's work. These guide its decisions within the harness's instruction hierarchy and permission boundaries.",
    source: "https://code.claude.com/docs/en/sub-agents",
    sourceLabel: "Instructions in agent definitions",
    readme: `# Agent instructions

Define how a specialist should work.

## Example guidance

You are the code review agent. Read the proposed diff and its callers. Check correctness and missing regression coverage. Report actionable findings with file locations and impact. Leave source edits to the implementation task.

## Loading

In Claude Code, the Markdown body of a subagent definition supplies its system prompt. Other hosts use their own formats. The instructions belong to the role; tool access and lifecycle hooks need separate configuration.
`,
  },
  {
    id: "agent-skills",
    mapNodeId: "agents",
    origin: "agent definition",
    label: "Skills",
    name: "Agent skills",
    kind: "Workflow",
    icon: LightbulbIcon,
    support: "Preloading skills depends on the host's agent configuration.",
    description: "Reusable workflows selected for a specialized agent.",
    distinction:
      "An agent definition can reference skills to preload into its context. The skill remains a separate workflow; associating it with an agent does not copy it into the definition or grant additional permissions.",
    source: "https://code.claude.com/docs/en/sub-agents",
    sourceLabel: "Preloading skills into subagents",
    readme: `# Agent skills

Give a review agent the workflows it needs at startup.

## Example

In a Claude Code subagent definition, a skills list can name a review-checklist skill. Its full content is loaded into the subagent's context rather than merely advertised for later discovery.

## Scope

Install the referenced skill where that host can discover it. Do not assume every skill available to the parent conversation is inherited by a subagent. Other harnesses may load skills on demand or use different configuration.
`,
  },
  {
    id: "agent-tools",
    mapNodeId: "agents",
    origin: "agent definition",
    label: "Tools",
    name: "Agent tools",
    kind: "Capability",
    icon: WrenchIcon,
    description: "Tool access configured for an agent's role.",
    distinction:
      "An agent definition can select or restrict available tools. These are references and access rules; the tools' implementations are supplied by the harness or connected servers.",
    source: "https://code.claude.com/docs/en/sub-agents",
    sourceLabel: "Tool access for subagents",
    readme: `# Agent tools

Limit a specialist to the operations its task needs.

## Example

A review agent may have file reading and code search tools while an implementation agent can also edit files. Claude Code agent definitions support tool allowlists and exclusions.

## Permissions

A tool list determines availability within the host's rules. It does not override approvals, sandboxing, or server-side authorization. Referencing an MCP tool does not embed the server in the agent definition.
`,
  },
  {
    id: "agent-mcp-servers",
    mapNodeId: "agents",
    origin: "agent definition",
    label: "MCP servers",
    name: "Agent MCP configuration",
    kind: "Connection",
    icon: ServerIcon,
    support: "Host-specific configuration; plugin-installed agents may be restricted.",
    description: "MCP connections selected for a specialized agent.",
    distinction:
      "Some hosts let agent definitions reference shared MCP servers or define agent-specific connections. The harness manages those connections; support can differ between project, user, and plugin agents.",
    source: "https://code.claude.com/docs/en/sub-agents",
    sourceLabel: "MCP configuration in subagents",
    readme: `# Agent MCP configuration

Connect a specialist to the data needed for its task.

## Example

Claude Code project or user subagent definitions can use mcpServers to reference an existing server or provide an inline connection definition. A documentation agent might connect to a knowledge-base server.

## Installation limits

Claude Code ignores this field in plugin-provided agents. Configure the connection at the plugin root instead. Other hosts have different scoping and connection rules; follow their documented configuration.
`,
  },
  {
    id: "agent-hooks",
    mapNodeId: "agents",
    origin: "agent definition",
    label: "Hooks",
    name: "Agent hooks",
    kind: "Automation",
    icon: ZapIcon,
    support: "Host-specific configuration; plugin-installed agents may be restricted.",
    description: "Lifecycle handlers configured for an agent's scope.",
    distinction:
      "A host may support hooks in an agent definition. They apply to that agent's lifecycle or tool activity, while execution remains the harness's responsibility.",
    source: "https://code.claude.com/docs/en/sub-agents",
    sourceLabel: "Hooks in subagent definitions",
    readme: `# Agent hooks

Attach a lifecycle check to a specialized role.

## Example

A Claude Code project or user subagent can declare hooks in its frontmatter. A supported tool event can trigger a validation script while that agent is active.

## Scope

These handlers are not decisions made by the agent: the harness runs them at matching events. Claude Code ignores hooks in plugin-provided agent definitions, so use the plugin's hook configuration there. Verify supported events and installation scope before relying on a handler.
`,
  },
  {
    id: "skill-instructions",
    mapNodeId: "skills",
    origin: "skill",
    label: "Instructions",
    name: "Skill instructions",
    kind: "Guidance",
    icon: BookOpenIcon,
    description: "The procedure written in a skill's SKILL.md file.",
    distinction:
      "Instructions are the core of a skill: when to use it, how to perform the work, and what result to produce. Its supporting files provide additional material as needed.",
    source: "https://agentskills.io/specification",
    sourceLabel: "Agent Skills specification",
    readme: `# Skill instructions

Write a repeatable workflow in SKILL.md.

## Example procedure

1. Read the requested change and applicable project guidance.
2. Inspect the affected code and its callers.
3. Follow references/review-checklist.md for relevant checks.
4. Report findings and verification gaps.

## Loading

The skill's name and description help the host discover it. The Markdown body supplies the procedure when the skill is activated. These contents apply to project, plugin, and harness skills alike; their origin does not establish instruction priority.
`,
  },
  {
    id: "skill-resources",
    mapNodeId: "skills",
    origin: "skill",
    label: "Resources",
    name: "Skill resources",
    kind: "Context",
    icon: NotebookTextIcon,
    description: "References, scripts, and assets stored alongside a skill.",
    distinction:
      "Skills can include reference documents, specifications, executable scripts, and assets. These support the workflow; bundling a script does not automatically register a tool.",
    source: "https://agentskills.io/specification",
    sourceLabel: "Supporting files in Agent Skills",
    readme: `# Skill resources

Keep supporting material beside SKILL.md.

## Example layout

- references/review-checklist.md: detailed checks and project context.
- scripts/validate.sh: a validation command the workflow can request.
- assets/report-template.md: a reusable output template.

## Use

Reference these files from the skill using relative paths. Load only the material needed for the task. Script execution still uses an available tool and follows the harness's permissions. These contents are possible for skills from any origin.
`,
  },
  {
    id: "skill-hooks",
    mapNodeId: "skills",
    origin: "skill",
    label: "Hooks",
    name: "Skill hooks",
    kind: "Automation",
    icon: ZapIcon,
    support: "Requires a host extension such as Claude Code skill hooks.",
    description: "Event handlers declared by a skill in hosts that support them.",
    distinction:
      "Some hosts let skills register hooks through their metadata. This extends the portable skill format. The harness executes the handlers according to its own event and lifetime rules.",
    source: "https://code.claude.com/docs/en/skills",
    sourceLabel: "Claude Code skill frontmatter",
    readme: `# Skill hooks

Associate event handlers with a workflow in a supporting host.

## Example

Claude Code supports a hooks field in skill frontmatter. A workflow can register a validation handler for a supported event when the skill is invoked.

## Portability and lifetime

Hooks are a host extension, not a guarantee of the Agent Skills format. Claude Code registers skill hooks when the skill is invoked and keeps them for the session. Do not assume a hook ends when its checklist finishes, or that another host will load it.
`,
  },
  {
    id: "nested-skills",
    mapNodeId: "skills",
    origin: "skill",
    label: "Skills",
    name: "Nested skills",
    kind: "Workflow",
    icon: LightbulbIcon,
    support: "Requires support for nested skills in the MCP Skills extension.",
    description: "Separate skill directories bundled inside a parent skill directory.",
    distinction:
      "The MCP Skills extension permits nested skill directories. Reading their supporting files does not activate those skills; each nested skill needs separate activation and fresh user consent.",
    source:
      "https://skills.extensions.modelcontextprotocol.io/specification/stable/skills#nested-skills",
    sourceLabel: "Nested skills in the MCP Skills extension",
    readme: `# Nested skills

A skill directory can contain another complete skill under the MCP Skills extension.

## Example layout

A release skill may contain a review subdirectory with its own SKILL.md. Ordinary reference Markdown remains supporting material; it is not a nested skill without its own skill definition.

## Discovery and activation

Published nested skills have their own entries in the server's flat skill listing. Activating the parent does not activate a nested skill. The client must obtain fresh, explicit user consent for that separate activation. This extension's behavior is not universal across skill hosts.
`,
  },
  {
    id: "mcp-tools",
    mapNodeId: "mcp-servers",
    origin: "MCP server",
    label: "Tools",
    name: "MCP tools",
    kind: "Capability",
    icon: WrenchIcon,
    description: "Callable operations exposed by an MCP server.",
    distinction:
      "A server can expose tools with names, descriptions, and input schemas. The client discovers them and makes permitted calls; the server implements the operation.",
    source: "https://modelcontextprotocol.io/docs/learn/server-concepts",
    sourceLabel: "MCP server capabilities",
    readme: `# MCP tools

Expose a focused operation to an agent application.

## Example

A project knowledge server exposes search_docs with a query input. The client lists available tools, reads the description and schema, and can request a call with validated arguments.

## Boundaries

Enforce authorization and validate inputs on the server. The harness manages tool availability and any required approval. A tool is an operation, while a resource supplies content and a prompt supplies a reusable message template.
`,
  },
  {
    id: "mcp-prompts",
    mapNodeId: "mcp-servers",
    origin: "MCP server",
    label: "Prompts",
    name: "MCP prompts",
    kind: "Input",
    icon: MessageSquareIcon,
    description: "Reusable prompt templates published by an MCP server.",
    distinction:
      "MCP prompts are named, reusable message templates that clients can discover and retrieve, often with arguments. Publishing a prompt does not automatically apply it as global instructions.",
    source: "https://modelcontextprotocol.io/docs/learn/server-concepts",
    sourceLabel: "MCP prompts",
    readme: `# MCP prompts

Offer a reusable starting point for a task.

## Example

An issue server publishes summarize_issue with an issue_id argument. When selected through a supporting client, it returns messages asking for a concise summary and next steps.

## Selection

Prompts are designed for user selection through the client. The client decides how to present and use them. Server-wide instructions provide separate integration guidance; prompt templates do not silently replace the active conversation's instructions.
`,
  },
  {
    id: "mcp-resources",
    mapNodeId: "mcp-servers",
    origin: "MCP server",
    label: "Resources",
    name: "MCP resources",
    kind: "Context",
    icon: NotebookTextIcon,
    description: "Reference content exposed through MCP resource URIs.",
    distinction:
      "Resources supply context such as documents, specifications, or records. The client controls when to retrieve and include that content. A resource is not automatically an active instruction or skill.",
    source: "https://modelcontextprotocol.io/docs/learn/server-concepts",
    sourceLabel: "MCP resources",
    readme: `# MCP resources

Make project reference material available to a client.

## Example

A server exposes a project overview and API specification as resources with URIs, names, and media types. The client can discover or resolve them, then read the content when relevant.

## Use as context

Resources can contain text or binary data. Reading a document provides context; it does not install tools or activate a skill. The optional MCP Skills extension adds explicit discovery and activation behavior for skill content.
`,
  },
  {
    id: "mcp-instructions",
    mapNodeId: "mcp-servers",
    origin: "MCP server",
    label: "Instructions",
    name: "MCP instructions",
    kind: "Guidance",
    icon: BookOpenIcon,
    description: "Server-wide guidance explaining how to use its capabilities.",
    distinction:
      "An MCP server can return instructions during initialization. These explain conventions and workflows across its capabilities; the client decides how to surface or include that guidance.",
    source: "https://blog.modelcontextprotocol.io/posts/2025-11-03-using-server-instructions/",
    sourceLabel: "MCP server instructions",
    readme: `# MCP instructions

Explain conventions shared by a server's tools and resources.

## Example guidance

Use search_docs to find document IDs before requesting their contents. Cite the resource URI with each answer. Treat timestamps as UTC.

## Delivery

The server can provide this guidance through the instructions field in its initialization response. Client handling varies. Tool descriptions provide narrower usage guidance for individual operations; server instructions do not grant permissions or override the host's instruction hierarchy.
`,
  },
  {
    id: "mcp-skills",
    mapNodeId: "mcp-servers",
    origin: "MCP server",
    label: "Skills",
    name: "MCP skills",
    kind: "Workflow",
    icon: LightbulbIcon,
    support: "Requires the optional MCP Skills extension on the server and client.",
    description: "Skills discovered and delivered through an MCP extension.",
    distinction:
      "The MCP Skills extension adds skill discovery and file delivery using MCP. A supporting client handles user consent and activation. Clients without the extension do not automatically recognize resource files as skills.",
    source: "https://skills.extensions.modelcontextprotocol.io/specification/stable/skills",
    sourceLabel: "MCP Skills extension specification",
    readme: `# MCP skills

Deliver reusable workflows through a supporting MCP server.

## Discovery

The server declares the io.modelcontextprotocol/skills extension. A compatible client can use skills/list and skills/get, then retrieve skill files through MCP resources.

## Activation

The client must support the extension's consent and activation rules. Exposing a SKILL.md file as an ordinary resource is not enough to activate it automatically. Document the supported protocol and extension versions for both ends of the connection.
`,
  },
  {
    id: "tool-instructions",
    mapNodeId: "tools",
    origin: "tool definition",
    label: "Instructions",
    name: "Tool instructions",
    kind: "Guidance",
    icon: BookOpenIcon,
    description: "Usage guidance in a tool's description.",
    distinction:
      "A tool description can tell the agent when to call it, how to supply arguments, and how to interpret results. Those instructions accompany the tool contract; enforcement belongs in the implementation and host.",
    source: "https://modelcontextprotocol.io/docs/learn/server-concepts",
    sourceLabel: "Tool descriptions in MCP",
    readme: `# Tool instructions

Describe a tool so the agent can use it correctly.

## Example description

Search project documentation by keyword. Supply a concise query. The result contains document IDs and excerpts; retrieve the full document before citing details absent from the excerpt.

## Contract

Keep guidance aligned with the input schema and actual behavior. Descriptions can explain prerequisites and limitations, but do not replace validation or authorization. This pattern also applies to harness tools that do not use MCP.
`,
  },
  {
    id: "hook-instructions",
    mapNodeId: "hooks",
    origin: "hook definition",
    label: "Instructions",
    name: "Hook instructions",
    kind: "Guidance",
    icon: BookOpenIcon,
    support: "Requires a host and event that support prompt or agent hooks.",
    description: "Evaluation guidance embedded in prompt-based hook handlers.",
    distinction:
      "Some hosts support prompt or agent hook handlers with embedded instructions. The harness triggers the handler at a supported event. A hook that launches an agent does not contain that running agent.",
    source: "https://code.claude.com/docs/en/hooks",
    sourceLabel: "Prompt and agent hooks in Claude Code",
    readme: `# Hook instructions

Provide evaluation criteria for a prompt-based handler.

## Example guidance

At a supported completion event, evaluate whether the requested work is complete and whether required checks have evidence. Return the result in the format required by the host's hook contract.

## Support

Claude Code supports prompt and agent hook types for selected events. Their prompt field contains the evaluation instructions. Command handlers instead run scripts, which may contain no model instructions at all. Verify the event, response format, and timeout in the host's documentation.
`,
  },
].sort(
  (a, b) =>
    Number(Boolean(a.support)) - Number(Boolean(b.support)) || a.label.localeCompare(b.label, "en"),
);

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

## Project terminology

Read GLOSSARY.md for the project's shared terms and their meanings.
`,
  },
  {
    // Keep this ID stable for shared links and website profile overrides.
    id: "context-md",
    mapNodeId: "context-md",
    name: "GLOSSARY.md",
    kind: "Project terminology",
    icon: NotebookTextIcon,
    description: "Define shared project terms so people and agents use the same language.",
    distinction:
      "GLOSSARY.md defines project terminology, while AGENTS.md holds working guidance. Keep implementation decisions and progress notes in their own documents. Explicitly reference or load the glossary.",
    source: "https://github.com/mattpocock/skills/issues/207",
    sourceLabel: "Why GLOSSARY.md describes shared terminology",
    readme: `# GLOSSARY.md

Shared terms for a documentation website that explores project organization standards.

## Catalog

A named collection of entries that describe a project's organization conventions.

## Entry

A folder, file, or issue convention in a catalog, with a stable identity and optional documentation.

## Explorer

The interface for browsing a catalog and reading the selected entry's documentation.

## Website profile

A settings document that customizes the site's content and conventions.

Keep definitions concise and consistent with the language used by the team. Load this file explicitly or reference it from AGENTS.md.
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
      "Here, DESIGN.md gives agents the visual language and UI rules to follow when building screens. PRODUCT.md supplies product goals; GLOSSARY.md defines project terms. Reference or load DESIGN.md before UI work; discovery depends on the host.",
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
      "PRODUCT.md gives agents the product vision and user needs behind implementation decisions. Keep it focused on what the product does and why; link to DESIGN.md for UI rules and GLOSSARY.md for shared terminology. Reference or load it explicitly; the filename alone does not guarantee inclusion.",
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

export const AGENTIC_TEMPLATES = [
  ...AGENTIC_ELEMENTS,
  ...AGENT_EXAMPLES,
  ...INSTRUCTION_FILES,
  ...SCOPED_EXAMPLES,
];

export interface AgenticSearch {
  view?: "map" | "cards";
  template?: string;
  detailed?: boolean;
}

export function validateAgenticSearch(search: Record<string, unknown>): AgenticSearch {
  return {
    view: search.view === "map" || search.view === "cards" ? search.view : undefined,
    template: AGENTIC_TEMPLATES.find((template) => template.id === search.template)?.id,
    detailed: search.detailed === true || search.detailed === "true" ? true : undefined,
  };
}
