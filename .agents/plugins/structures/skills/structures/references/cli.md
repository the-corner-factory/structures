# Check and fix structure

Call the installed skill's scripts against the target project:

```sh
node <skill-directory>/scripts/check-structure.mjs --root <project-root> --json
node <skill-directory>/scripts/fix-structure.mjs --root <project-root> --json
```

`check` is read-only. `fix` reuses it, applies its concrete destination mappings, then checks again.
Run `fix` only for a correction request. Neither command changes policy or Git staging, fetches
templates, or installs packages. Add `--scope src/feature` to limit findings and moves to that
relative directory; reference updates can reach callers elsewhere in the project. An explicit
`--root` selects that directory. Otherwise use the Git root, or the current directory outside Git.

Exit codes: **0** means no remaining violations, **1** means violations, **2** means invalid
configuration or blocked execution. JSON includes `findings` (`code`, `path`, `rule`, `message`,
optional `destination`), `warnings`, and `ruleCount`. Fix adds `applied` mappings. Execution errors
go to stderr. Report coverage warnings; zero violations does not prove prose-only architecture.

## Executable rules

Save one fenced `structures-rules` JSON block in the root or relevant folder's inline
`folders.documentation` string. This preserves website compatibility. Paths are relative to the
folder's tree path, derived from names, not IDs. Parent rules also apply; use their `exclude` for
narrower exceptions. Rules are data, never shell commands or JavaScript.

For example, in the `src/` documentation:

````markdown
```structures-rules
{
  "ignore": ["generated", "vendor"],
  "required": ["index.ts"],
  "rules": [
    {
      "id": "module-names",
      "match": "**/*.{ts,tsx,mts,cts}",
      "exclude": ["routes/**", "**/*.gen.ts"],
      "case": "kebab-case"
    },
    {
      "id": "feature-folders",
      "match": "features/*",
      "kind": "folder",
      "case": "kebab-case"
    },
    {
      "id": "store-suffix",
      "match": "**/*-store.ts",
      "rename": { "pattern": "(.*)-store\\.ts", "replacement": "$1.store.ts" }
    },
    {
      "id": "test-location",
      "match": "**/*.test.ts",
      "path": "features/[^/]+/[^/]+\\.test\\.ts"
    }
  ]
}
```
````

| Field        | Meaning                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `ignore`     | Globs excluding paths and descendants from checks in this scope.                                                            |
| `required`   | Literal relative paths that must exist without traversing symlinks.                                                         |
| `rules[].id` | Unique within the block; identifies diagnostics.                                                                            |
| `match`      | Node `path.matchesGlob` syntax: `**`, `*`, braces. Dotfiles need explicit dot patterns.                                     |
| `kind`       | `file` (default) or `folder`.                                                                                               |
| `exclude`    | Rule-specific glob exceptions.                                                                                              |
| `case`       | `kebab-case`; computes a rename, retaining the extension and dot suffix separators.                                         |
| `name`       | Full-match JavaScript Unicode regex for the filename, including extension. Check-only.                                      |
| `path`       | Full-match regex for the relative path. Check-only.                                                                         |
| `rename`     | Full-match `pattern` and `replacement` for the relative path; numbered captures such as `$1` support suffixes and grouping. |

Each rule needs a constraint. Regex strings use JSON escaping. Rename outputs must be literal
relative paths inside the documentation folder. Use patterns that stop matching after correction.
Unknown fields and invalid rules fail validation. Companions need their own matching rules or a
shared pattern covering their suffixes.

Existing curated tree paths are checked for type and casing. Missing examples remain optional;
unlisted paths remain allowed. The CLI does not infer moves from similar names. Encode required
placement with `path` and a deterministic `rename` when its destination is known.

## Ownership and instance lifetime

Application-wide instances and infrastructure belong in `core`. Code instantiated and used
exclusively by a child folder belongs with that child, including a local singleton. Reusable
definitions with independent consumer-owned instances and stateless helpers belong in `shared`.
Instance count alone does not determine ownership. Preserve request-scoped lifetimes on servers.

Enable analysis in the common parent's documentation, adapting paths to the adopted template:

````markdown
```structures-rules
{
  "rules": [
    {
      "id": "service-ownership",
      "match": "**/*.{service,store}.ts",
      "ownership": {
        "core": "core",
        "shared": "shared",
        "owners": ["pages/*", "features/*"]
      }
    }
  ]
}
```
````

`ownership.core` and `ownership.shared` are literal directories relative to this documentation
scope. They can name the same directory when a project groups both lifetimes together, or separate
directories; neither can be nested inside the other. `owners` contains globs matching actual child
directories. Owners may be nested within core/shared, but cannot equal or contain those roots.
The deepest configured boundary containing every consumer owns a local module.
Otherwise an instance belongs to core and a reusable definition to shared. Select candidate
modules with `match` and `exclude`; exclude framework entry points and public APIs whose external
consumers are unknown. Existing templates without `ownership` keep their existing checks.
Keep filename transformations in separate rules.

Analysis requires the target project's installed TypeScript and root `tsconfig.json`. It follows
used symbols through aliases, namespace access, and re-export barrels, including type references,
and traces consumers through core/shared helpers to child owners. Unused imports and test/spec
consumers do not decide production ownership. Production source beneath the common core/shared
parent and configured child folders must be covered by tsconfig; other sources are analyzed when
in the project.
`--scope` filters findings, not consumer analysis.

Lifetime evidence includes module-level or static class initializers using `new`, a factory
call, object or array literals, local `new` expressions, and Angular
`@Injectable({ providedIn: 'root' | 'platform' })`,
including import aliases. A static construction site is evidence, not proof of runtime instance
count. Custom containers, framework discovery, external consumers, and runtime code generation
may require an architectural review. The CLI moves whole files, not individual exports.

Findings include `evidence.consumers` and `evidence.instantiations` (path, line, kind). A clear
`ownership` finding supplies a `destination` at the owning boundary, retaining the basename;
test/spec companions move beside it. Existing subfolders inside the correct owner are retained.
The fixer uses the same TypeScript rename and rollback path as naming fixes, then checks again.
Filename-only mappings compose with ownership moves; conflicting directory mappings block fixes.

`ownership-review` has no executable destination. Its optional `suggestedDestination` is for
review; the fixer leaves it unresolved. This covers feature-only root providers, mixed or unknown
lifetimes, no resolved production consumers, companion resources, and incomplete source coverage.
Provider registrations and lifetimes stay unchanged; resolve them in a scoped code migration.
Literal `import()` calls count as consumers. Existing CSS files imported by relative paths or
package import aliases, including `?url` imports, do not affect ownership. Review a proposed
move if the source file imports a relative stylesheet.
Computed imports, unresolved local imports, sources outside tsconfig, and unsupported framework
source produce warnings and withhold automatic ownership moves. Missing TypeScript, invalid
configuration, and project references stop analysis with exit code 2.

## Fix boundaries

Git inventory includes tracked and untracked nonignored files. Outside Git, traversal excludes
`.git` and `node_modules`; use `ignore` for generated/vendor rules. Symlinks are reported and not
followed. Exclude framework filenames and published paths unless their migration is covered.

Source moves require the target project's installed `typescript` and a root `tsconfig.json`
covering those sources. The TypeScript rename API updates relative imports, aliases, re-exports,
and runtime `.js` specifiers. Project references require a separate migration. Non-source moves
with no detected references need no compiler.

The fixer blocks collisions, conflicting/overlapping moves, affected staged files, symlink
destinations, ignored contents inside moved directories, computed imports, glob discovery, and
unmanaged path references, including documentation or asset/config references it cannot rewrite.
On failure it rolls back completed moves and edits, reporting any rollback failure. It does not
provide crash recovery or coordinate concurrent edits; use a stable checkout and run project checks
afterward. References outside the inventoried project cannot be verified.

Check-only constraints and missing required paths remain findings; fix never invents file contents
or relaxes policy. Report the blocker and resolve only the missing policy or migration decision.
Do not replace the CLI with an improvised bulk rename.
