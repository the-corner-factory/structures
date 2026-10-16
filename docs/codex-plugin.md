# Structures plugin

The plugin in [`.agents/plugins/structures`](../.agents/plugins/structures/plugin.json) contains three
skills:

- `project-structures` analyzes the current project or requested related repositories and produces
  `settings.json` with inline Markdown plus a project overview. A requested Gist upload uses an
  available authenticated Gist tool or GitHub CLI; local generation needs neither.
- `commit` drafts a Conventional Commit message from current changes and repository commit rules,
  including commitlint configuration. It previews the message in chat by default; `--push` creates
  a local commit with hooks enabled. Remote pushes require a separate, explicit request.
- `rename-assets` renames content files using `[asset_name]-[type]-[modifier].[extension]`, with
  meaningful subjects, roles, and variants. It asks for missing context, preserves file formats,
  checks for collisions, and updates local references.

The plugin is independent of the React application and requires no MCP server or added package
dependencies. The documentation checker uses Node.js standard libraries. Installing this plugin
does not grant source access or authorize publication.

The package follows [Agent Plugins](https://agent-plugins.org/plugin-authors/manifest), which
[Codex supports](https://developers.openai.com/plugins/build/plugins#plugin-structure):

```text
.agents/plugins/
├── marketplace.json
└── structures/
    ├── plugin.json
    ├── skills/project-structures/SKILL.md
    ├── skills/commit/SKILL.md
    ├── skills/rename-assets/SKILL.md
    ├── assets/icon.png
    └── LICENSE
```

`plugin.json` holds the portable identity and version. Hosts discover skills in `skills/` by
convention; the portable manifest has no `skills` field. Codex presentation metadata is isolated in
`extensions.com.openai.interface`. Each skill's resources and optional `agents/openai.yaml`
metadata live inside its directory. There are no MCP servers or hooks to configure.

Keep this single manifest and bundled skills as the source of truth. The old `.codex-plugin/plugin.json`
compatibility manifest is unnecessary for clients that support this format. Marketplace discovery
was checked with Codex CLI 0.160.0; older clients may need an update.

## Install and use

The repo marketplace is [`.agents/plugins/marketplace.json`](../.agents/plugins/marketplace.json).
Once these files are committed and pushed to GitHub, users can install from the repository's Git
URL in a supported Codex CLI. The sparse checkout includes the catalog and complete plugin without
downloading the application source:

```sh
codex plugin marketplace add https://github.com/the-corner-inc/structures.git --sparse .agents/plugins
codex plugin add structures@structures-marketplace
```

To install from a particular branch or tag, append `--ref <branch-or-tag>` to the marketplace command.
For local testing, use this repository's absolute path instead of the Git URL and omit `--sparse`.
The marketplace is the repository catalog; `structures` is the plugin; `project-structures`,
`commit`, and `rename-assets` are its skills. Git URL installation requires these files on the
selected remote ref, not just locally.
Restart the desktop app if the new marketplace does not appear immediately.
Test in a new chat with the installed plugin:

```text
Use $project-structures to analyze this project and generate a documented Structures profile.
```

To preview a commit message in a copyable Markdown code block:

```text
Use $commit to generate a message for the current changes.
```

To create a local commit with the generated message:

```text
Use $commit --push to commit the current changes.
```

The commit skill uses staged changes when present, preserving partial staging. With nothing staged,
it selects the current task's changes. It leaves unrelated work untouched and applies the
repository's effective commit rules before committing. Despite its name, `--push` does not run
`git push` or create a Git tag.

To rename asset files:

```text
Use $rename-assets to standardize the files in public/images using [asset_name]-[type]-[modifier].[extension].
```

Use underscores within names and modifiers, and hyphens between parts. For example,
`the_corner-icon-filled-white_bg.png` is already correct: `the_corner` is the asset name, `icon`
is the type, and `filled` and `white_bg` are modifiers. Keep familiar abbreviations such as `bg`
for background. An unclear filename such as `IMG_1042.webp` prompts
a question about its subject and intended use, such as the blog topic or product it belongs to.
Request a preview to see the proposed mapping without renaming files.

For Gist publication, request it explicitly and choose visibility:

```text
Use $project-structures to analyze this project and publish the architecture guide as a secret GitHub Gist.
```

Secret Gists are unlisted, readable by anyone with the link. Local files can be inspected and
redacted before uploading. Load the resulting Gist page URL through Structures' **Website settings
URL** control. Omitted profile sections retain built-in examples, which the overview identifies.

## Other harnesses

The reusable workflows are the [Agent Skills](https://agentskills.io/specification) directories
`skills/project-structures/`, `skills/commit/`, and `skills/rename-assets/`. The architecture skill
uses file access, a Node.js 24.15+ (24.x) or 26+ checker with no third-party dependencies, and
optionally an authenticated Gist tool or `gh`. The commit skill uses Git and the target repository's
installed validators.
The asset-renaming skill uses file inspection, search, and rename tools. None of the skills depend
on Codex tool names or application imports.

- **Agent Plugins hosts:** distribute the whole `.agents/plugins/structures/` directory. The host
  must support the portable manifest and skills; installation and Git marketplace support depend
  on that host.
- **Agent Skills hosts:** copy the desired skill directory from `skills/` into the host's
  documented skill location, including any `scripts/`, `references/`, and `assets/`. Include the
  plugin's `LICENSE` in that copy. `agents/openai.yaml` is optional OpenAI UI metadata; the workflow
  does not depend on it. Invoke the skill using that harness's syntax.
- **Other plugin formats:** add a small manifest or packaging adapter when supporting a specific
  host. Reuse the same skill files rather than maintaining another copy of the workflow.

A Git URL is a source location, not a universal installer. Other harnesses have not been tested.
Before advertising one, install a packaged copy in that harness, generate both local files from a
small repository, and run the bundled checker. Test publication separately only when requested.

## Validate

From the repository root:

```sh
node --test scripts/check-structures-plugin.test.mjs
pnpm test src/lib/site-settings.test.ts
pnpm format:check
```

The marketplace resolves `./.agents/plugins/structures` relative to the repository root. Keep the manifest,
icons, MIT license, and self-contained skills together. Update the plugin version in its manifest
when distributing a new version; this is separate from the application's version.

The [plugin CI workflow](../.github/workflows/plugins.yml) runs the two test commands on pull requests,
main pushes, and version tags. Tests verify all skill entrypoints, exercise the checker from a
detached skill directory, and check the bundled example against the website's full
`parseSiteSettings` parser. The standalone checker
tests folder fields, node shape, IDs, and documentation coverage; it does not validate other profile
sections. The skill describes full validation when a Structures checkout is available.

For a read-only check that the local CLI discovers the marketplace, run from any directory with
the repository's absolute path:

```sh
codex plugin list --marketplace structures-marketplace --available --json \
  -c 'marketplaces.structures-marketplace={source_type="local",source="/absolute/path/to/structures"}'
```

This checks discovery without installing or changing the user's configured marketplaces. After
pushing, repeat installation from the Git URL in a test environment and start a new chat to verify
skill invocation; local discovery alone does not establish that the remote ref is ready.

## Distribute updates through Git

Distribution uses the repository marketplace, following
[Codex's Git marketplace support](https://developers.openai.com/plugins/build/plugins).
After updated plugin files are committed and pushed, users can refresh the configured source:

```sh
codex plugin marketplace upgrade structures-marketplace
```

A marketplace pinned to a fixed commit or tag stays at that revision. Choose a branch ref when
users should receive future changes from that branch.
