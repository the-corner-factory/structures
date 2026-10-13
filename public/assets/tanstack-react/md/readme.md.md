# README.md

**Path:** `README.md`\
**Role:** Recommended

## Purpose

The project entry point for contributors: explain the application, local setup, scripts, architecture, and deployment.

## Guidelines

Keep commands consistent with `package.json`. Include prerequisites and environment variable names, using placeholders for values. The complete reference tree and conventions below describe this example application.

## TanStack Start / React reference structure

This is a comprehensive reference for **TanStack Start with React and TypeScript**, using TanStack Router for file-based routing. Query and Form are optional integrations; Table and Virtual are included as optional examples. This tree documents an application layout, not a runnable starter or an instruction to install every TanStack library.

The framework requires its router and root route alongside the build configuration. Folders such as `features`, `server`, and `tests` are project conventions. Authentication, a database, editor settings, CI, and deployment integrations are choices, not TanStack requirements. Each entry states its role and has its own guide in this explorer.

`posts` is the example business domain. Keep only the branches relevant to your application. `routeTree.gen.ts` and the lockfile are generated. Start supplies default client and server entries; `client.tsx`, `server.ts`, and `start.ts` are shown to explain the available customization points.

## Complete tree

```text
├── README.md
├── .agents/
│   └── skills/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── public/
│   ├── favicon.ico
│   └── site.webmanifest
├── src/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── _auth/
│   │   │   ├── route.tsx
│   │   │   ├── dashboard.tsx
│   │   │   └── settings.tsx
│   │   ├── _public/
│   │   │   ├── route.tsx
│   │   │   ├── login.tsx
│   │   │   └── {-$lang}/
│   │   │       ├── route.tsx
│   │   │       ├── index.tsx
│   │   │       ├── about.tsx
│   │   │       └── posts/
│   │   │           ├── route.tsx
│   │   │           ├── index.tsx
│   │   │           └── $postId.tsx
│   │   ├── api.health.ts
│   │   ├── api.webhooks.ts
│   │   ├── robots[.]txt.ts
│   │   └── sitemap[.]xml.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   └── input.tsx
│   │   ├── layout/
│   │   │   ├── app-shell.tsx
│   │   │   └── site-header.tsx
│   │   └── feedback/
│   │       ├── error-boundary.tsx
│   │       ├── not-found.tsx
│   │       └── pending.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.functions.ts
│   │   │   ├── auth.queries.ts
│   │   │   └── sign-in-form.tsx
│   │   └── posts/
│   │       ├── post.schema.ts
│   │       ├── post.types.ts
│   │       ├── posts.functions.ts
│   │       ├── posts.queries.ts
│   │       ├── posts.mutations.ts
│   │       ├── post-list.tsx
│   │       ├── post-detail.tsx
│   │       ├── post-form.tsx
│   │       ├── post-table.tsx
│   │       ├── post-virtual-list.tsx
│   │       ├── post-form.test.tsx
│   │       └── post.schema.test.ts
│   ├── hooks/
│   │   ├── use-app-form.ts
│   │   └── use-media-query.ts
│   ├── lib/
│   │   ├── query-client.ts
│   │   ├── form-context.ts
│   │   ├── format.ts
│   │   └── utils.ts
│   ├── server/
│   │   ├── auth.server.ts
│   │   ├── db.server.ts
│   │   ├── posts.server.ts
│   │   ├── logger.server.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── request.middleware.ts
│   │   └── schema/
│   │       └── posts.table.ts
│   ├── env/
│   │   ├── client-env.ts
│   │   └── server-env.ts
│   ├── styles/
│   │   ├── app.css
│   │   └── tokens.css
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   ├── types/
│   │   └── vite-env.d.ts
│   ├── router.tsx
│   ├── routeTree.gen.ts
│   ├── start.ts
│   ├── client.tsx
│   └── server.ts
├── tests/
│   ├── setup.ts
│   ├── test-utils.tsx
│   ├── fixtures/
│   │   └── posts.json
│   ├── mocks/
│   │   └── handlers.ts
│   ├── integration/
│   │   └── posts.integration.test.ts
│   └── e2e/
│       ├── posts.spec.ts
│       └── auth.spec.ts
├── migrations/
│   └── 0001_create_posts.sql
├── scripts/
│   └── seed.ts
├── docs/
│   ├── architecture.md
│   ├── routing.md
│   ├── data-flow.md
│   ├── testing.md
│   └── deployment.md
├── .env.example
├── .gitignore
├── .editorconfig
├── .prettierrc
├── .prettierignore
├── eslint.config.js
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── CONTRIBUTING.md
└── LICENSE
```

## How the pieces work together

1. A route validates URL input and asks its loader for the screen's data.
2. With Query enabled, the loader and component share feature query options and cache keys.
3. A server-function wrapper validates input and calls server-only business or persistence code.
4. The server verifies identity and resource access before returning a public data shape.
5. A form keeps draft values locally; a successful mutation invalidates the affected cached data.

Keep URL state in validated router search parameters, remote state in Query when needed, form drafts in Form or local React state, and short-lived UI state in components. Create router dependencies per server request. Never store the current user's session in a process-wide singleton.

## Naming and boundaries

Use `.tsx` for JSX and `.ts` for non-JSX modules. This example uses kebab-case component filenames and preserves Router's special filenames. Directory layouts use `route.tsx` and render an `Outlet`. Other route filenames follow Router conventions: dots nest routes, `$` marks parameters, `_` marks pathless layouts, and `{-$lang}` adds an optional language segment. `_auth` requires a session; `_public` contains public pages. Root server routes serve `/robots.txt` and `/sitemap.xml`. The generated tree owns route type registration.

Ordinary route loaders may run on the server and in the browser. Place database and secret-dependent work behind server functions or server route handlers. A `server` directory is organizational; use the installed Start version's supported execution and import protections.

The React-only SPA alternative can reuse feature, UI, query, and test organization with TanStack Router, but needs its own client bootstrap and a separate backend. This reference deliberately documents the full-stack Start variant.

## Documentation maintenance

In this repository, `public/assets/tanstack-react/settings.json` drives the explorer. Each node maps to `md/<lowercase-id>.md`, with `name` as the fallback when `id` is omitted. Display names can repeat; IDs must remain globally unique. Layout files keep their previous IDs (for example `_auth.tsx`) so existing links still work. The visible `_auth/route.tsx` uses `_auth.tsx.md`. Keep the JSON and Markdown synchronized.

## Official documentation

- [TanStack Start setup](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch)
- [Router filename conventions](https://tanstack.com/router/latest/docs/routing/file-naming-conventions)
- [Router and Query integration](https://tanstack.com/router/latest/docs/integrations/query)
- [Start server functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [TanStack Form validation](https://tanstack.com/form/latest/docs/framework/react/guides/validation)

Use documentation matching the versions installed in your application. Deployment adapters and integration APIs can change independently of the organization suggested here.
