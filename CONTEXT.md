# Structures: codebase context

This describes the checked-out code, not a guarantee of what has been released. Working guidance
and commands live in [AGENTS.md](AGENTS.md); user-facing setup is in [README.md](README.md).

## Purpose and product

Structures is an open-source knowledge library from The Corner for exploring and sharing project
organization standards. Its VS Code-style explorer pairs a recursive JSON tree with Markdown
explanations. Users can search, select entries through shareable URLs, load one website-wide settings
profile from a GitHub Gist or another CORS-enabled endpoint, download settings, and print the expanded
tree. The navigation's single profile control applies across all six sections; omitted sections
retain built-in content.

The site also explains issue labels, priorities, statuses, naming conventions, branching strategies,
and agent concepts. Issue cards and boards are educational examples, not a persisted issue tracker.
The Agentic page opens with an interactive system map, with concept cards and downloadable
Markdown templates also available. Selecting a map block highlights its directed connections and opens the matching
example; a text connection list also supports small screens and assistive technology. The page
does not execute agents. Accounts are scaffolded but disabled by default.

A second deliverable is `structure-explorer`, an editable React component distributed through the
root shadcn registry. It is source copied into consumer projects, not a hosted service or npm package.

## Code map

| Location                                    | Responsibility                                                                           |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/router.tsx`                            | Router creation, per-router QueryClient, query provider, error/not-found defaults.       |
| `src/routes/`                               | TanStack file routes, route parameters, search validation, auth layouts, auth API.       |
| `src/components/`                           | Website shell, explorer integration, boards, standards pages, branch diagrams.           |
| `src/components/structures/`                | Portable explorer, shared tree/data helpers, Markdown renderer, scoped CSS.              |
| `src/lib/structures.ts`                     | Folder/issue catalog types, library/topic lists, URL resolution, fetch boundaries.       |
| `src/lib/site-settings.ts`                  | Website profile types, complete-document validation, and Gist/raw URL fetching.          |
| `src/components/site-settings-provider.tsx` | Shared browser-only profile query, context, and loading/error boundary.                  |
| `src/lib/use-structure-settings.ts`         | Website profile/catalog selection and inline or fetched Markdown resolution.             |
| `src/lib/branches.ts`                       | Branch graph types, parsing, preset list, and fetching.                                  |
| `src/lib/agentic.ts`                        | Agent concept cards, reference links, and Markdown templates.                            |
| `src/lib/material-icons.ts`                 | Material icon manifest and filename/folder icon lookup.                                  |
| `src/lib/auth/`, `src/lib/db/`, `src/env/`  | Optional accounts, PostgreSQL access, and validated environment variables.               |
| `src/styles.css`                            | Website layout, colors, dark theme, responsive behavior, and print styles.               |
| `public/assets/`                            | Built-in JSON catalogs and their Markdown content.                                       |
| `packages/gitgraph-*`                       | Vendored Gitgraph workspace packages with TypeScript source and tracked compiled output. |
| `registry.json`, `docs/registry.md`         | Registry distribution manifest and consumer contract.                                    |
| `scripts/`                                  | Static prerendering, registry validation/consumer checks, and graph debugging.           |
| `.github/workflows/`                        | Release-tag verification/deployment and registry consumer CI.                            |

## Runtime and navigation

The application uses React 19 and strict TypeScript, with TanStack Start for server rendering,
TanStack Router for file routing, and TanStack Query for remote state. Vite+ 1 drives development,
builds, linting, formatting, and Vitest 5 tests. Development requires Node.js 24.15+ (24.x) or 26+.
Vite configuration also enables the React compiler, Tailwind CSS 4, and Nitro's Node server output.
The workspace pins its Vite implementation through
the catalog in `pnpm-workspace.yaml`.

`pnpm dev` runs Vite+ through Portless at `https://structures.localhost`, with a free backend port
and branch-prefixed hostnames for linked Git worktrees. `PORTLESS=0 pnpm dev` uses port 3000 directly.

`src/routes/__root.tsx` owns the HTML document, metadata, CSS, theme provider, and application shell.
`AppShell` renders navigation from `TOPICS`, the website settings control, theme controls, and
presentation mode. `SiteSettingsProvider` wraps the shell; its boundary keeps content behind loading
or retry feedback until the complete profile validates. An optional profile `logo` replaces the
navigation image after validation, using an HTTP(S) URL and accessible alternative text. Its `url`
is the light-mode image and fallback; optional `darkUrl` supplies a dark-mode image. CSS follows
the root `.dark` class and hides the inactive image from display and accessibility. Custom logos
retain their colors in both themes; omitting the override or resetting restores The Corner.
Theme choice is stored under
`structures-theme` in local storage; an early script applies it before hydration.

The root validates `settings=<URL>` and retains it across internal navigation through TanStack
Router's `retainSearchParams` middleware. The URL is authoritative; input drafts remain local and
profiles are not persisted in local storage. Load/Reset create history entries, preserve applicable
page configuration, and return explorer library/document routes to the topic root to clear stale
selections. Reset removes both `settings` and legacy `source`. Loading the same URL refreshes it.
Root settings take precedence over `source`, including when a profile omits the current section.

Shareable page configuration belongs in validated TanStack Router search state. The Agentic page
uses `view=map|cards` and `template=<id>` (a building block, `prompt`, `agents-md`, `context-md`,
`design-md`, or `product-md`),
for example `/agentic?view=cards&template=agents-md`. Missing or invalid values show the system map
and Harness. Controls update the URL without resetting scroll; reloads and Back/Forward restore
the view and template together. The defaults are omitted when controls update the URL. Hover and
focus stay local. Heading links and copied heading URLs preserve the current query parameters.

Folder and issue explorers store their search filter in `q`, for example
`/folders/tanstack-react?q=components`. The input reads directly from the URL, so direct links,
reloads, and Back/Forward restore the filtered tree. Typing replaces the current history entry
without resetting scroll or the heading anchor. Selecting a file or folder preserves `q` and
the global `settings` or legacy `source`; changing the library or loading another profile also
retains the filter.

Each page supplies a content-specific title and description through route `head` metadata.
`src/lib/seo.ts` keeps search and social titles/descriptions aligned and resolves explorer library,
document, and branch-preset metadata from route parameters and the selected source. This metadata
is server-rendered and included in the static pages without fetching custom sources on the server.

| URL                                               | Main behavior                                                   |
| ------------------------------------------------- | --------------------------------------------------------------- |
| `/`                                               | Topic chooser; profile input is in the shared navigation.       |
| `/folders`                                        | Library chooser alongside the default `user` structure.         |
| `/folders/$library`, `/folders/$library/$element` | Folder explorer and selected documentation.                     |
| `/issues`                                         | Sample issue cards with contextual label/status documentation.  |
| `/issues/$library`, `/issues/$library/$element`   | Issue taxonomy explorer and documentation.                      |
| `/issues/labels`, `/status`                       | Label gallery and Kanban status board.                          |
| `/issues/priorities`, `/naming`                   | Priority and naming reference pages.                            |
| `/branches`                                       | Profile graph, built-in `?flow=<preset>`, or legacy `?source=`. |
| `/agentic`                                        | Agent concepts and downloadable example templates.              |
| `/login`, `/signup`, `/account`, `/api/auth/*`    | Optional account UI and Better Auth boundary.                   |

The `_auth` and `_guest` route directories are pathless layouts. Explorer document route filenames
use `$library_.$element.tsx`; the underscore keeps the document route out of the library layout's
nesting. `src/routeTree.gen.ts` is generated from the route files.

## Catalog and documentation flow

`SiteSettingsProvider` makes one TanStack Query request keyed by `["site-settings", url]` after
hydration. `fetchSiteSettings` accepts a raw HTTP(S) JSON URL or resolves an ordinary Gist page via
GitHub's API to `files["settings.json"].raw_url`. Both requests share the abort signal, omit
credentials, and report load errors. `parseSiteSettings` validates the whole version-1 document
before exposing content; it reuses the shared tree and branch validators. Switching URLs isolates
query results, and the header/boundary expose loading, reset, and retry controls.

1. Folder/issue explorer routes pass `kind`, optional `library`/`element`, and validated `source`
   search state into the website's `StructureExplorer`.
2. `useStructureSettings` uses a supplied profile section directly. Otherwise it selects the legacy
   source only when no global profile is active, then `/assets/<library>/`, then the default
   `/assets/user/` for folders or `/assets/software/` for issues.
3. Built-in and legacy catalogs load after hydration with key `["structure-settings", source]`.
   `fetchSettings` validates the wrapper and calls the shared tree parser before rendering. Profile
   sections reuse the provider data without a second catalog request.
4. Search filters the tree while retaining ancestors of matching descendants. The website tree
   adapts the shared accessible tree with Material icons or issue colors.
5. Selecting a node navigates to its stable ID, preserving settings/source and the filter.
   `MarkdownViewer` is lazy-loaded. Profile documentation resolves inline by lowercased ID; missing
   content shows an unavailable state. Catalog documentation fetches after hydration with key
   `["structure-markdown", source, element]`.

The QueryClient defaults to five-minute freshness and disables refetching on window focus.
Explorer content is fetched in the browser, so static HTML does not contain all of the catalog's
Markdown. Custom sources must allow browser CORS requests; there is no server-side content proxy.

Folder/issue settings contain `libraryName`, optional `manifestConfig`, and `structures`. Each node
has a `name`, `type` (`container`, `folder`, or `file`), optional stable `id`, colors, and children.
`parseStructures` enforces globally unique case-insensitive IDs, valid single path segments, and
no nonempty children on files. Documentation uses the lowercased ID, falling back to the name.
For a legacy source ending in `.json`, Markdown is resolved from that document's directory; local catalog
directories resolve to `settings.json` and `md/<id>.md`. Absolute HTTP(S) settings sources are used
as given.

Website profiles add optional inline `documentation` maps and priority-node `description`/`example`
strings without changing the registry's node API. `issues.examples` references canonical label and
status IDs, normalized case-insensitively by the parser. Issue cards, labels, priorities, and Status
all use that issue tree; Status columns are its `Kanban` children. A supplied issue section replaces
the whole built-in profile, including an empty examples list when omitted. Missing documentation
never falls back to built-in Markdown. Naming fields retain omitted values, but supplied arrays
replace lists, including empty arrays. Agentic content overrides merge by existing template ID;
preview and download share the resolved Markdown while IDs, icons, relationships, and map geometry
stay fixed. See [docs/site-settings.md](docs/site-settings.md) and
[public/settings.example.json](public/settings.example.json) for the contract and full example.

Selectable folder catalogs are Angular, Go, and TanStack Start / React. `user` supplies the default
folder example; `software` supplies issue content. Disabled framework choices are placeholders.
Files in these catalogs are documentation examples, including the large TanStack example tree;
they do not describe this repository's literal source layout.

Branch presets have a separate schema: `libraryName`, optional description, `branches`, and
directed `edges`. Parsing checks IDs, kinds, optional fields, and edge references. Five built-in
presets live in `git-flow`, `github-flow`, `gitlab-flow`, `trunk-based`, and `trunk-based-release`.
`BranchFlowPage` uses a supplied profile graph or fetches the chosen preset/legacy source and renders
`BranchGraph`, which turns the model into
illustrative Gitgraph commits and merges. Descriptions appear on hover/focus. The separate
`branch-flow.tsx` contains an SVG layout implementation; the current page uses `branch-graph.tsx`.
Built-in selections use validated `flow` values from `BRANCH_FLOWS`; invalid values show the chooser.
The chooser stays available when a website profile omits `branches`.

## Reusable explorer contract

The portable `StructureExplorer` accepts a node array, optional controlled selection, callbacks,
custom icon rendering, and an optional `getDocumentation(node, { signal })` resolver. It validates
input, manages its own search, and reuses the same tree as the website. Documentation requests run
in an effect, abort on cleanup, ignore stale results, and support missing/error/retry states.

`StructureMarkdown` uses react-markdown, GFM, and syntax highlighting, skips raw HTML, and adds
copy controls. Its shared `anchor-heading.tsx` is included in the registry with scoped heading-link
styles. The component stylesheet uses scoped selectors and host theme variables. The
intended consumer contract is React 18+ and Tailwind 4, with no required TanStack providers or
website assets; see [docs/registry.md](docs/registry.md) for API details.

`registry.json` declares the copied source, CSS, license, documentation, and exact runtime
dependencies. `registry:check` checks the manifest and imports and builds `.registry-build/`.
`registry:test` installs that artifact into temporary Vite, Next.js, and TanStack Start projects,
then checks types, builds, and preservation of host CSS. The consumer directories are retained;
`REGISTRY_TEST_DIR` can choose their parent location.

## Accounts and persistence

The TanStarter-derived account layer uses Better Auth, Drizzle, and PostgreSQL. Database schemas
cover users, sessions, accounts, and verification; public catalog browsing uses static assets.
`src/env/client.ts` and `src/env/server.ts` validate configuration with Zod through env-core.

Both auth flags default to false. Session lookup returns `null` before importing Better Auth when
disabled, and the auth API returns HTTP 503. Enabling accounts requires `AUTH_ENABLED=true`,
`VITE_AUTH_ENABLED=true`, `DATABASE_URL`, a `BETTER_AUTH_SECRET` of at least 32 characters, the
appropriate base URL, and a configured database schema. GitHub and Google OAuth credentials are
optional. Server-only imports and middleware keep credentials and authorization on the server.

`pnpm db` invokes Drizzle Kit; its configuration requires `DATABASE_URL`, reads
`src/lib/db/schema/index.ts`, and writes migrations under the currently ignored `drizzle/` directory.
`auth:generate` targets the Better Auth schema. Environment examples live in `.env.example`.

## Build, deployment, and release

`pnpm build` produces `.output/server/index.mjs` and `.output/public`. Material icon SVGs are served
from the installed `material-icon-theme` package by a development middleware and copied as Nitro
public assets for production. The app version is injected as `__APP_VERSION__` from `package.json`.

`scripts/prerender-static.mjs` starts the built server on `127.0.0.1:4173` with server auth disabled,
fetches an explicit set of public routes and catalog entry URLs, checks responses, and writes
directory `index.html` files. It skips catalog entries named `index.html` to avoid output collisions.
`public/.htaccess` preserves existing files/directories and supplies client-side route fallbacks,
including explorer entries whose names contain file extensions.

The main CI workflow runs lint, tests, build, and prerender on `v*` tags, then uploads
`.output/public` to FTP. It also calls the reusable registry consumer workflow, which runs directly
on PRs. After deployment and all registry consumers succeed, a separate job publishes a GitHub
Release with the matching changelog section via `scripts/release-notes.mjs`. Only that job receives
`contents: write`; reruns skip existing releases. `commit-and-tag-version` updates the package
version and changelog; that same stable version tag identifies the registry source and release.
Account-enabled deployments must run the Node server instead of the static
FTP artifact. See [CONTRIBUTING.md](CONTRIBUTING.md) and the
[release skill](.agents/skills/release/SKILL.md) for the release procedure.

## Current caveats

- The Copilot instructions still describe the removed Angular implementation. Follow the current
  React source and tooling configuration for development.
- Playwright scripts/dependencies exist, but no app E2E configuration or specs are present.
- The vendored Gitgraph React package uses React 16 typings; the app supplies a React 19 type
  shim. Package `lib/` output is tracked and consumed at runtime, so source-only edits are incomplete.
