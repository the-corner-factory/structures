# Contributing

Thank you for helping improve Structures. Please follow the project’s
[Code of Conduct](CODE_OF_CONDUCT.md) and search the
[issue tracker](https://github.com/the-corner-inc/structures/issues) before opening duplicate work.

## Setup

```bash
pnpm install
pnpm dev
```

Node.js 24.15+ (24.x) or 26+, and pnpm 11.23+ are required. `pnpm dev` serves the app through Portless
at `https://structures.localhost`; see [Development](README.md#development) for first-run setup and
the direct localhost fallback. Before opening a pull request, run:

```bash
pnpm lint
pnpm test
pnpm build
pnpm prerender:static
pnpm registry:check
pnpm registry:test
```

Use focused tests for domain behavior and regressions. Keep commit messages in Conventional Commit
form:

```text
<type>(<scope>): <short summary>
```

Common types include `feat`, `fix`, `perf`, `refactor`, `docs`, `build`, `ci`, and `test`.

## Content contributions

Built-in structures live under `public/assets/<library>/settings.json`; their documentation lives
under `public/assets/<library>/md/`. New or changed content should keep the JSON tree and lowercase
Markdown filenames in sync. Documentation keys use `id ?? name` (lowercased); keep IDs
stable and globally unique even when filenames repeat. See [the registry guide](docs/registry.md)
when changing shared explorer code or the distributed files.

## Releases

Only maintainers should create releases. Start from a clean, up-to-date `main` branch and preview
the calculated version and changelog:

```bash
pnpm release:dry-run
```

Then create the version commit and Git tag:

```bash
pnpm release
git push --follow-tags origin main
```

`commit-and-tag-version` updates `package.json` and `CHANGELOG.md` from Conventional Commits. The
application reads that same package version at build time, so the explorer footer automatically
matches every release.

Before pushing a release, run `pnpm build`, `pnpm registry:check`, and `pnpm registry:test`.

Pushing a stable `vX.Y.Z` tag starts the CI workflow. It verifies and deploys the website and runs
the Vite, Next.js, and TanStack registry consumer matrix. Once both jobs succeed, it automatically
creates the GitHub Release using the matching `CHANGELOG.md` section. The release job has
`contents: write` permission and uses GitHub's built-in token; no additional secret is needed.
It verifies the tag and package version and skips an existing release when rerun. If publication
fails, rerun the failed job after fixing the cause.

The root `registry.json` publishes the explorer from the same GitHub tag. After pushing a release,
validate it with `pnpm dlx shadcn@4.21.0 registry validate the-corner-factory/structures#vX.Y.Z`
(substitute the new tag), then verify the entry on the
[GitHub Releases page](https://github.com/the-corner-factory/structures/releases). Consumers can pin
that tag; there is no separate registry server or npm publish.

To restore a missing GitHub Release for an existing tag, use an authenticated GitHub CLI:

```bash
node scripts/release-notes.mjs vX.Y.Z > /tmp/structures-release-notes.md
gh release create vX.Y.Z --repo the-corner-factory/structures --verify-tag \
  --title vX.Y.Z --notes-file /tmp/structures-release-notes.md --latest=false
```

Use the notes for that version only. For historical tags without a changelog section, review the
commits since the preceding tag and write the notes explicitly. Publish older entries with
`--latest=false`, then mark the newest stable release as latest. Creating a GitHub Release for an
existing tag does not trigger the tag-push FTP deployment; do not recreate or move historical tags.

## Accounts and persistence

Better Auth and Drizzle are intentionally disabled in public development by default. Do not commit
secrets or point automated tests at shared databases. When working on account features, copy
`.env.example`, use a disposable local PostgreSQL database, and keep authorization checks inside
server functions or middleware as well as protected routes.
