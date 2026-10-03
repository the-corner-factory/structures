# Working on Structures

Structures is a React application for browsing project organization standards, plus a reusable
shadcn registry explorer. Read [CONTEXT.md](CONTEXT.md) for the architecture and data flows,
[CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance, and
[docs/registry.md](docs/registry.md) before changing distributed explorer files.

## Use the current stack

- Use Node.js 24.15+ (24.x) or 26+ and the pnpm version pinned in `package.json` (currently 11.23.0).
- The app uses React 19, TypeScript, TanStack Start/Router/Query, Tailwind CSS 4, Vite+, and Nitro.
- `package.json`, `vite.config.ts`, and the implementation describe the active tooling.
  `.github/instructions/copilot-instructions.md` still describes the previous Angular application;
  its Angular commands, aliases, and component conventions are obsolete for this app.
- Files under `public/assets/` describe example projects. Their documented dependencies and
  directory layouts are content, not instructions for implementing this repository.

## Development and checks

Run commands from the repository root:

| Command                                | Purpose                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `pnpm install`                         | Install workspace dependencies. CI uses `--frozen-lockfile`.                |
| `pnpm dev`                             | Start development through Portless at `https://structures.localhost`.       |
| `pnpm lint`                            | Lint and type-check through Vite+.                                          |
| `pnpm test`                            | Run the tests under `src/`.                                                 |
| `pnpm test src/lib/structures.test.ts` | Run a focused test file.                                                    |
| `pnpm format:check`                    | Check formatting.                                                           |
| `pnpm build`                           | Build the Nitro server and public assets in `.output/`.                     |
| `pnpm prerender:static`                | Render static entry pages; requires a successful build first.               |
| `pnpm start`                           | Run the built Node server, loading `.env` if present.                       |
| `pnpm registry:check`                  | Validate the registry manifest, dependencies, and packaged files.           |
| `pnpm registry:test`                   | Install, type-check, and build clean Vite, Next.js, and TanStack consumers. |

Portless assigns the Vite+ port and prefixes hostnames in linked Git worktrees. Use the printed URL.
`PORTLESS=0 pnpm dev` bypasses the proxy and uses port 3000. See `README.md` for first-run setup.

Use focused checks while editing. Follow the pre-PR checklist in `CONTRIBUTING.md` for application
changes; include the registry checks when touching distributed files. Documentation-only changes
need formatting and reference checks, not new application tests. Consumer tests install packages
and need registry access; `pnpm registry:test vite` runs only one consumer.

Tests use Vitest 5 through `vite-plus/test`; DOM tests opt into jsdom with
`// @vitest-environment jsdom` and use Testing Library. Add regression coverage to the existing
relevant test file for behavior changes.
The `test:e2e` script exists, but there is currently no app Playwright configuration or E2E suite.

## Implementation boundaries

- Keep route files in `src/routes/` thin; put UI in `src/components/` and shared data behavior in
  `src/lib/`. Use the app's `#/` import alias and existing TanStack patterns.
- Keep shareable page configuration (views, selected templates, applied filters) in validated
  TanStack Router search parameters so reloads, links, and Back/Forward restore it. Read from the
  URL directly, preserve other applicable parameters on updates, and use safe defaults for invalid
  values. Keep hover, focus, and unapplied drafts local. `/agentic` uses `view=map|cards` and
  `template=<id>` from `AGENTIC_TEMPLATES`; defaults are the system map and Harness. Heading links
  must preserve query parameters. Use history replacement for live typing, and avoid scroll resets
  for in-page configuration changes.
  Folder and issue explorers use `q` for their search filter; preserve it on item, library, and
  source changes, and omit it when the input is empty.
- Website profiles use root-validated `settings=<URL>`, retained by the root search middleware.
  Keep the single URL/Load/Reset control in navigation and load profiles only after hydration via
  `SiteSettingsProvider`. `settings` takes precedence over legacy `source`; Reset removes both.
  Use validated `flow=<preset>` for built-in branch selections. Profile changes must preserve
  applicable filters and Agentic selections while clearing stale explorer document selections.
  An optional profile `logo` customizes the navigation image after validation. Render its HTTP(S)
  `url` as the light-mode image and fallback, with optional `darkUrl` for dark mode. Follow the root
  `.dark` class, hide the inactive image from display and accessibility, preserve alternative text
  and original colors, and restore the default on Reset.
- Give pages content-specific titles and descriptions through route `head` metadata and
  `src/lib/seo.ts`; keep these available in server-rendered and prerendered HTML.
- `src/routeTree.gen.ts` is generated by TanStack routing. Add or rename route source files and
  let development/build tooling regenerate the tree instead of editing it by hand.
- Reuse `src/components/structures/structure-data.ts` for structure identity, validation, and
  filtering. `src/lib/structures.ts` re-exports these helpers for the app.
- `src/components/structure-explorer.tsx` is the website integration. The similarly named
  `src/components/structures/structure-explorer.tsx` is the portable registry component.
- Distributed files must be self-contained: use relative internal imports, declare all shipped
  files and external dependencies in `registry.json`, and keep the MIT notice. Avoid coupling
  them to the app router, providers, `#/` aliases, Material icon assets, or global CSS.
- Preserve hydration-safe browser access, lazy explorer Markdown loading, request cancellation,
  loading/error/retry states, keyboard navigation, focus visibility, and accessible labels.
- Keep website styles in `src/styles.css`. Registry styles live in
  `src/components/structures/structure-explorer.css` and must remain scoped to the component.
- Follow `vite.config.ts` formatting: two spaces, double quotes, semicolons, trailing commas,
  and a 100-column print width. Its formatter settings differ from the old TypeScript quote
  preference in `.editorconfig`.

## Content changes

- Folder and issue catalogs use `public/assets/<library>/settings.json` and matching `md/` files.
  Keep `libraryName` equal to the asset directory name for built-in explorer catalogs.
- A node's identity is `id ?? name`. IDs must be stable, globally unique within the tree ignoring
  case, and valid single path segments. Give repeated display names distinct explicit IDs.
- Documentation filenames are `${(id ?? name).toLowerCase()}.md`; `README.md` therefore maps to
  `readme.md.md`. Preserve the existing URL handling for TanStack filename characters.
- Add selectable folder/issue libraries to `EXPLORER_FRAMEWORKS` in `src/lib/structures.ts` and
  update `scripts/prerender-static.mjs`. Review the prerender list when adding public routes.
- Branch presets use a separate `branches`/`edges` schema, validated in `src/lib/branches.ts`.
  Register them in `BRANCH_FLOWS`; do not pass branch data to the folder-tree parser.
- Agentic page templates are authored in `src/lib/agentic.ts`.
- Website profile types and validation live in `src/lib/site-settings.ts`; the contract is documented
  in [docs/site-settings.md](docs/site-settings.md) with [public/settings.example.json](public/settings.example.json).
  Keep website-only inline documentation, issue examples, priority descriptions, and Agentic
  overrides outside the portable registry API. Status derives from the issue tree's `Kanban` group.
  Omitted sections retain built-in defaults; a supplied issue section must never mix custom
  taxonomies with built-in examples or documentation. Validate the complete profile before use.

## Server, packages, and releases

- Public browsing must work without a database. Accounts default off via `AUTH_ENABLED=false`
  and `VITE_AUTH_ENABLED=false`. Preserve the lazy server-only auth/database boundaries.
- For account work, start from `.env.example`, use a disposable local PostgreSQL database, and
  keep authorization in server functions/middleware as well as protected routes. Never commit
  secrets. Accounts require the Node server deployment rather than static FTP hosting.
- `packages/gitgraph-core` and `packages/gitgraph-react` are local workspace forks. Runtime
  exports resolve to their tracked `lib/` output. After editing package source, rebuild core
  before React with `pnpm --filter @gitgraph/core build` and
  `pnpm --filter @gitgraph/react build`, and review the generated changes. The root build does
  not run these package builds.
- Keep the React compatibility shim at `src/types/gitgraph-react.d.ts` in mind when changing
  the app's Gitgraph usage; the vendored React package has older React typings.
- Use Conventional Commits. When a release is requested, follow the
  [release skill](.agents/skills/release/SKILL.md) and `CONTRIBUTING.md`. Pushing a `v*` tag
  triggers the production FTP deployment and registry consumer checks; after both succeed, CI
  creates the GitHub Release from the matching changelog section. The registry uses the same tag;
  the root package is private and is not published to npm.
- Preserve unrelated working-tree changes and avoid committing build/cache output. Update
  these instructions and `CONTEXT.md` when the documented architecture or workflow changes.
