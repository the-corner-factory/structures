# Structures plugin

The plugin in [`.agents/plugins/structures`](../.agents/plugins/structures/plugin.json) exposes one
skill: `/structures <request>`. Use natural language or a short command. Hosts that invoke skills
with `$` use `$structures <request>` instead. The single entrypoint and command references follow
[Impeccable](https://github.com/pbakaus/impeccable); no Impeccable runtime is required.

| Example                                                    | Result                                                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/structures`                                              | Show the actions without changing files.                                                                   |
| `/structures init folder structure`                        | Choose a local file/project, Gist, or repository and initialize `.agents/configs/.structures/config.json`. |
| `/structures update folder structure`                      | Refresh the template from the chosen source, preserving local rules and unrelated sections.                |
| `/structures audit folders`                                | Report placement issues without edits.                                                                     |
| `/structures fix folder structure`                         | Correct misplaced files using the template and update affected references.                                 |
| `/structures create commit title`                          | Return only a Conventional Commit subject in a copyable block.                                             |
| `/structures create commit message`                        | Draft a message using the project's effective commit rules.                                                |
| `/structures commit --push`                                | Create a local commit with hooks enabled; no remote push.                                                  |
| `/structures audit modules src`                            | Report source naming and companion-grouping mismatches without edits.                                      |
| `/structures rename modules src`                           | Rename TypeScript modules and companions using saved project rules.                                        |
| `/structures set module naming rules`                      | Save scoped conventions in the template without renaming files.                                            |
| `/structures rename assets in public/images`               | Rename assets and update local references.                                                                 |
| `/structures document project`                             | Export a documented website profile and architecture overview.                                             |
| `/structures publish architecture as a secret GitHub Gist` | Prepare and publish the requested guide.                                                                   |

Only the requested workflow is loaded. A request to fix folders and suggest a commit title applies
the folder corrections and drafts a title; it does not commit. Analysis-only and preview requests
remain read-only. Missing folder configuration does not block commit titles or asset renaming.

## Folder template

The maintained template lives in `<project-root>/.agents/configs/.structures/config.json`, including when a command
is invoked from a subdirectory. This repository's [template](../.agents/configs/.structures/config.json) records its
architectural boundaries. `init` also accepts the longer `init folder structure` command.

`.agents/configs/` holds project-specific configuration for different skills, with a separate
directory for each skill. Structures uses `.structures/`:

```text
.agents/
├── configs/
│   └── .structures/
│       ├── config.json
│       └── exports/       # Optional derived website/Gist files
├── skills/                # Local workflow definitions
└── plugins/               # Packaged skills and resources
```

Existing projects can move their root `.structures/config.json` to the new path, preserving its
contents. The skill can still read the legacy file when the new one is absent; it migrates that file
before a requested configuration write. Audits remain read-only. If both paths exist, the new path
is authoritative and the legacy file is retained. Existing exports stay in place unless their move
is requested.

Initialization asks whether to load a local file/project, a Gist, or a repository unless you have
already supplied the source. External templates become local snapshots; audits and fixes use the
saved copy. Use `update folder structure` (or `update folder template`) to refresh it on request.
The skill records the source path or URL and resolved revision in the root's inline documentation.
An existing template is retained during initialization; updates preserve stable IDs, local
documentation, exceptions, and unrelated profile sections, resolving conflicts before replacement.
Invalid or unavailable sources leave the existing configuration unchanged.

The template reuses the [website profile format](site-settings.md): `version: 1`, `folders`, a tree,
and inline documentation. It has one root container representing the project directory. Descendant
folder and file names define literal relative paths; IDs identify nodes and never serve as paths.
Documentation records responsibilities, placement rules, and exceptions. See the full
[template contract](../.agents/plugins/structures/skills/structures/references/template.md).

Setup creates the template configuration, not example source files or directories. This is a
curated placement guide, not a list of everything allowed or a scaffolding command.
Omitted files remain valid. Folder corrections preserve the template and check imports, routes,
exports, globs, public paths, and collisions before moving files. An absent template is initialized
from clear project rules during a fix; an audit only recommends initialization. Invalid templates
are reported rather than silently replaced. Ambiguous architectural changes need a concrete decision.

Validate a template with the bundled, dependency-free checker:

```sh
node <skill-directory>/scripts/check-template.mjs <project-root>/.agents/configs/.structures/config.json
```

It checks folder structure, literal path segments, case-insensitive path collisions, IDs, and
documentation coverage. The website's `parseSiteSettings` owns validation of optional profile
sections. The plugin tests also run the repository template and bundled example through that parser.

`document project` uses the saved template and reports differences from the checkout. It writes
derived `settings.json` and `<project>-structures.md` files to `.agents/configs/.structures/exports/` by default.
`settings.json` retains its exact name because ordinary Gist page URLs resolve that filename in the
website. Maintain `.agents/configs/.structures/config.json`; regenerate exports instead of editing two templates.
For multiple repositories, keep one config in each root and combine the exported guides as needed.

## TypeScript module naming

`rename modules` handles source files and their companion tests, templates, and styles. It follows
project-specific casing, role suffixes, and grouping rules, updating imports, re-exports, lazy
routes, and other references together. Framework filenames and published module paths retain their
contracts. `audit modules` and previews report the proposed mapping without writing anything.

Rules are saved under **Module naming rules** in the relevant folder's inline documentation in
`.agents/configs/.structures/config.json`. Folder audits/fixes consult them, and template updates preserve local
rules and exceptions. `set module naming rules` updates this policy without moving source files.
The existing `naming` profile section continues to describe commit messages. This is agent guidance;
the template validator does not lint TypeScript filenames, and installing the skill does not make
it run automatically during implementation.

For example, request `/structures set module naming rules: store modules in src/shared use
<name>.store.ts` and then `/structures rename modules src/shared`. With that adopted convention,
`guest-draft-store.ts` becomes `guest-draft.store.ts`. A page-folder rule can similarly group a
consultation page's source, template, and spec. These conventions are scoped to the chosen project,
not imposed on all TypeScript code. Exact one-off renames do not invent broader policy.

## Commits, assets, and publication

Commit previews use staged changes when present, preserving partial staging. With nothing staged,
they select the requested work or current task's changes. Effective repository rules, including
commitlint, govern the message. The existing `--push` option creates a local commit; remote pushes,
tags, and history rewriting require their own requests.

Asset names use `[asset_name]-[type]-[modifier].[extension]`, with underscores within parts and
hyphens between parts. For example, `the_corner-icon-filled-white_bg.png` is already correct.
The workflow checks collisions, updates references, preserves formats, and asks for missing subject
or usage context. Request a preview to see a proposed mapping without renaming files.

Gist-ready output alone does not request publication. Publishing uses an authenticated Gist tool or
GitHub CLI, uploads the export and overview, and verifies the uploaded files. Secret Gists are
unlisted and readable by anyone with the link. Load the resulting Gist page URL through the
website's **Website settings URL** control. Omitted sections retain built-in examples, identified
in the overview. Local generation needs no GitHub connection.

## Packaging and installation

The portable [Agent Plugins](https://agent-plugins.org/plugin-authors/manifest) package is:

```text
.agents/plugins/
├── marketplace.json
└── structures/
    ├── plugin.json
    ├── skills/structures/
    │   ├── SKILL.md
    │   ├── agents/openai.yaml
    │   ├── references/
    │   ├── scripts/
    │   └── assets/config.example.json
    ├── assets/icon.png
    └── LICENSE
```

`plugin.json` holds identity and version; hosts discover `skills/structures/` by convention.
Codex presentation metadata stays in `extensions.com.openai.interface`. The workflow has no
application imports, MCP servers, hooks, added dependencies, or dependency on Codex tool names.
The checkers require Node.js 24.15+ (24.x) or 26+. Reuse this one skill and its references rather
than distributing separate copies of each workflow.

Once the files are committed and pushed, install using the repository marketplace:

```sh
codex plugin marketplace add https://github.com/the-corner-inc/structures.git --sparse .agents/plugins
codex plugin add structures@structures-marketplace
```

Append `--ref <branch-or-tag>` to select a remote revision. For local testing, use this repository's
absolute path instead of the Git URL and omit `--sparse`. The marketplace is the catalog;
`structures` is both the plugin name and its single skill name. Start a new chat after loading the
updated plugin. In a host with `$` invocation, use:

```text
Use $structures to create a commit title for the current changes.
```

The former `project-structures`, `commit`, `rename-assets`, and `fix-folder-structure` skill
directories are consolidated into command references. Replace old invocations with `/structures`
plus the task. The names `project-structures`, `rename-assets`, and `fix-folder-structure` are also
recognized after `/structures` for migration; no separate skill installation is needed.

Agent Plugins hosts can distribute the complete plugin directory. For Agent Skills hosts, copy
`skills/structures/` with all resources into the host's skill location and include the plugin's
MIT `LICENSE`. `agents/openai.yaml` is optional UI metadata. Host-specific installation and slash
command discovery need testing in that host; a Git URL alone is not a universal installer.

## Validate and distribute

From the repository root:

```sh
node --test scripts/check-structures-plugin.test.mjs
pnpm test src/lib/site-settings.test.ts
pnpm format:check
```

The [plugin CI workflow](../.github/workflows/plugins.yml) runs both test commands on pull requests,
main pushes, and version tags. Tests verify the single discoverable entrypoint, packaged resource
links, template validation, detached checker execution, and website compatibility. They do not
prove host command discovery or the quality of every agent-driven reorganization.

For a read-only local marketplace discovery check:

```sh
codex plugin list --marketplace structures-marketplace --available --json \
  -c 'marketplaces.structures-marketplace={source_type="local",source="/absolute/path/to/structures"}'
```

Keep the manifest, icons, MIT license, and skill resources together. Update the plugin's manifest
version when distributing a new version, separately from the application version. After changes
are committed and pushed, users can refresh the configured source:

```sh
codex plugin marketplace upgrade structures-marketplace
```

A marketplace pinned to a commit or tag stays at that revision; use a branch to receive subsequent
changes. Local checks do not establish that the remote ref contains the new skill. Test Git URL
installation and a fresh-chat invocation after publication; test Gist publication only when requested.
