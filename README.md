# Structures

Structures is an open-source knowledge library for exploring, documenting, and sharing project
organization standards. It presents folder structures and issue workflows in a familiar,
VS Code-like explorer with Markdown documentation for every entry.

The application is built with React, TanStack Start, TanStack Router and Query. Its foundation is
adapted from [TanStarter](https://github.com/mugnavo/tanstarter), including optional Better Auth and
Drizzle boundaries for the future account and sharing experience.

## Features

- Explore Angular, Go, TanStack Start / React, and software issue-management structures.
- Search nested structures and read contextual Markdown without loading the Markdown renderer up
  front.
- Load one website-wide `settings.json` from a GitHub Gist or another CORS-enabled URL in the
  navigation, covering all six sections.
- Download the active structure as JSON.
- Copy a permanent link to any built-in or custom structure, including the selected explanation.
- Print a polished, fully expanded folder tree for PDF export or sharing.
- Switch theme or minimize the explorer for focused reading.
- Keep public browsing database-free while account infrastructure remains disabled by default.

## Development

Requirements: Node.js 24.15+ (24.x) or 26+, and pnpm 11.23+.

```bash
pnpm install
pnpm dev
```

Open [https://structures.localhost](https://structures.localhost).
[Portless](https://github.com/vercel-labs/portless) assigns Vite+ a free port and proxies this URL
to it. The first run sets up a local certificate authority and may request administrator access
to trust it and bind port 443. Linked Git worktrees get a branch-prefixed hostname; use the URL
printed in the terminal.

To bypass the proxy, run `PORTLESS=0 pnpm dev` and open
[http://localhost:3000](http://localhost:3000). When enabling accounts, set `VITE_BASE_URL` in `.env`
to the browser URL, including any worktree prefix or fallback port.

Useful checks:

```bash
pnpm lint
pnpm test
pnpm build
```

The default production build creates a Nitro Node server in `.output/server`. CI renders the
built-in routes as static directory indexes with `pnpm prerender:static`, verifies the artifact, then
uploads `.output/public` to the existing FTP host. Apache rewrites remain available for custom and
unknown client-side routes.

## Structure content

Built-in libraries live under `public/assets/<library>/`:

- `settings.json` describes the recursive explorer tree.
- `md/<lowercase entry id>.md` contains the documentation displayed for an entry.

The [TanStack Start / React catalog](public/assets/tanstack-react/settings.json) documents 36 folders
and 96 files, covering routing, UI, data, server code, tests, and deployment. Read the
[complete structure and overview](public/assets/tanstack-react/md/readme.md.md) or open
`/folders/tanstack-react` in the application. Each entry has its own Markdown guide.

Register folder libraries in `EXPLORER_FRAMEWORKS` in `src/lib/structures.ts` and include them
in `scripts/prerender-static.mjs` for static deployment. Keep `libraryName` equal to the asset
directory name so selected entries retain the correct library in their URLs.

Entry IDs default to names; add distinct stable `id` values wherever filenames repeat. Display names
can change without breaking links when IDs remain the same. Legacy `?source=` links still use this
catalog format and resolve Markdown relative to the source JSON file.

## Website settings

Use the navigation's **Website settings URL** field to load one profile across Folders, Issues,
Naming, Status, Branches, and Agentic. Paste an ordinary GitHub Gist link containing `settings.json`
or a raw HTTP(S) JSON URL, then choose **Load**. **Reset** restores built-in content. Omitted sections
retain their defaults, and the selected profile follows navigation through the shareable
`?settings=<URL>` parameter without an account or local-storage persistence.

Start with [settings.example.json](public/settings.example.json), save it to your Gist as
`settings.json`, and follow the [website settings guide](docs/site-settings.md). The profile uses
`version: 1`, inline Markdown, and one issue taxonomy shared by issue cards, priorities, labels, and
Status. It is separate from the portable explorer's API and the legacy catalog format.

## Accounts (prepared, disabled)

Better Auth, Drizzle, PostgreSQL schemas, `/login`, `/signup`, `/account`, and the auth API boundary
are scaffolded from TanStarter. Public builds do not require a database. To enable accounts, copy
`.env.example`, configure the database and secret, set `AUTH_ENABLED=true` and
`VITE_AUTH_ENABLED=true`, run the database generation/migration workflow, and deploy the default
server build instead of the static FTP build.

## Releases

Releases use `commit-and-tag-version`. The package version is injected into the application at
build time and appears at the bottom of the explorer, so it cannot drift from `package.json`.
Pushing a stable version tag runs deployment and registry consumer checks, then automatically
publishes the matching changelog section to
[GitHub Releases](https://github.com/the-corner-factory/structures/releases).

See [CONTRIBUTING.md](CONTRIBUTING.md) for the release checklist and contribution guidelines.

## Embed Structures in your website

The `structure-explorer` shadcn registry block installs an editable React component with search,
keyboard navigation, customizable icons and optional Markdown documentation. Bring your own folder
JSON; no TanStack providers or application navigation are installed.

After the registry release is published:

```sh
pnpm dlx shadcn@latest add the-corner-inc/structures/structure-explorer
```

See the [installation and customization guide](docs/registry.md) for examples, stable IDs,
Tailwind 4 theming, documentation loading, updates and tag-pinned installation.
