---
name: structures
description: Manage project structure through one entrypoint. Use to initialize or update .agents/configs/.structures/config.json from local folders, a Gist, or a repository, audit or fix folder organization, document architecture for the Structures website, draft Conventional Commit titles or messages, rename assets, or audit and rename TypeScript modules using saved naming rules.
license: MIT
---

# Structures

Use `/structures <request>` (or `$structures <request>` in hosts using that syntax). Interpret
natural language as well as the short commands below. Load only the reference for the requested
work; every reference and bundled resource resolves from this skill's directory, independently
of the target project's location.

## Commands

| Request after `/structures`                                                | Action                                                                                               | Reference                               |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `init`, `init folder structure`, `create folder template`                  | Choose a local, Gist, or repository source and initialize `.agents/configs/.structures/config.json`. | [Setup](references/setup.md)            |
| `update folder structure`, `update folder template`                        | Refresh the saved template from the chosen source while preserving local rules.                      | [Setup](references/setup.md)            |
| `audit folders`, `analyze folder structure`                                | Report mismatches without changing files.                                                            | [Folders](references/folders.md)        |
| `fix folder structure`, `reorganize folders`                               | Apply necessary moves using the saved template and update references.                                | [Folders](references/folders.md)        |
| `create commit title`, `commit`, `create commit message`                   | Draft a Conventional Commit title or message in chat.                                                | [Commit](references/commit.md)          |
| `commit --push`                                                            | Create a local commit using the existing commit workflow; this does not push remotely.               | [Commit](references/commit.md)          |
| `audit modules [path]`, `rename modules [path]`, `set module naming rules` | Audit or rename TypeScript modules and retain scoped naming conventions.                             | [Modules](references/rename-modules.md) |
| `rename assets [path]`                                                     | Rename content files consistently and update references.                                             | [Assets](references/rename-assets.md)   |
| `document project`, `generate profile`, `publish architecture as a Gist`   | Generate a website export and overview; publish only when requested.                                 | [Documentation](references/document.md) |

## Routing

- With no request, or for `help`, show the available actions. Recommend `init` when the project
  has no `.agents/configs/.structures/config.json`, but wait for a choice before writing anything.
- Route by the user's intent, not an isolated keyword: “create commit title” is a draft;
  “analyze folders and correct them” is a fix; “analyze folders” alone is read-only. A question
  about a workflow calls for an explanation, not execution. Ask only when materially different
  actions remain plausible.
- The former workflow names `project-structures`, `fix-folder-structure`, and `rename-assets`
  are accepted as requests after `/structures`; they are no longer separate installed skills.
- Route TypeScript/source-file naming requests to the module workflow, including requests phrased
  as “rename assets” when the targets are source modules. Mixed requests use both workflows.
- For a combined request, load the relevant references as needed and execute in dependency order.
  A request to fix folders and suggest a commit title still produces only a draft title.

## Shared project context

Resolve the requested project root and read its applicable instructions. For Git repositories,
use the repository root even when invoked in a subdirectory; outside Git, use the requested
project directory. Inspect each explicitly requested repository separately.

`<project-root>/.agents/configs/` stores project-specific configuration for different skills.
Structures owns its `.structures/` subdirectory; workflow instructions and bundled resources stay
in the installed skill directory.

The durable folder and module-naming template is `<project-root>/.agents/configs/.structures/config.json`. Folder commands and
documentation read [the template contract](references/template.md). A website/Gist `settings.json`
is a derived export or an explicitly selected import source, never a second source of folder policy. Existing templates remain authoritative
until the user requests a template update; a folder fix must not rewrite the template to accept drift.

Module rules live in the template’s inline documentation; see [Modules](references/rename-modules.md).
Commit and content-asset-renaming requests do not require a template or create one as a side effect.
Preserve the scope and write permissions of each request. Bare invocation, help, audits, and
commit-title requests leave project files and Git state unchanged.
