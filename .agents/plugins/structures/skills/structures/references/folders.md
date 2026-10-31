# Fix folder structure

Bring the requested project or subtree into line with its own architecture. Use the current
workspace when no path is specified. Apply clear, necessary corrections when the user asks to fix
or reorganize the structure, including `/structures fix folder structure`. Analysis,
audit, review, and preview requests without a correction request are read-only. A consistent
structure needs no changes.

## Establish the placement rules

Read [the template workflow](template.md) and load `<project-root>/.agents/configs/.structures/config.json`.
Validate it with `scripts/check-template.mjs` from the skill directory before planning moves.
If it is missing, follow the workflow's audit/fix handling. Keep the saved template unchanged
throughout corrections; updating it to match a violation would conceal the problem.

Read applicable repository instructions, architecture documents, manifests, and build/test
configuration. Inspect the working-tree status, including staged and untracked files, before
planning changes. Use `rg --files --hidden` or `git ls-files` to inventory relevant source and
configuration, excluding Git internals, dependencies, caches, and generated output from the audit.
Keep vendored code and separate workspaces within their documented boundaries.

Use the saved template together with the user's requested standard and applicable project rules,
checking framework-required paths against installed tooling. Use consistent patterns in comparable
modules only where the template and documented rules are silent. Trace
representative imports and entry points to establish each directory's actual responsibility.
Consult [module naming rules](rename-modules.md) when auditing or fixing source filenames and
companion grouping, including files omitted from the tree. Distinguish explicit rules from inferred
conventions. Read folder responsibilities from template documentation; derive concrete paths from node names and hierarchy as the template contract specifies.
Treat omitted paths as unspecified, not obsolete. Example catalogs and exported profiles become
policy only when deliberately adopted into `.agents/configs/.structures/config.json`.

When evidence conflicts or no consistent convention exists, report the ambiguity and propose a
small concrete layout before asking for the missing decision. Continue independent, unambiguous
corrections. Avoid imposing a generic `components/services/utils` layout or a new architecture.

## Map necessary corrections

Classify each finding as a misplaced existing module or a proposed architectural refactor.
Extracting code into new components changes module boundaries. For an extraction, identify the
responsibility being separated and its concrete benefit. Follow the project's declared ownership
rules; file size alone does not establish a placement defect. Report architectural proposals
separately from placement corrections, and apply them only within the user's requested scope.

For each placement finding, identify the current path, the violated rule or observed convention, the
destination, and the reason the move is needed. Read the file's responsibilities and callers;
a filename alone is insufficient evidence. Leave intentional exceptions and already-conforming
files in place. Create directories only to hold files that actually need moving.

Before each move, account for:

- Imports from callers and relative imports inside moved files, including tests and fixtures.
- Aliases, package entry points/exports, workspace manifests, build inputs, CI paths, and scripts.
- File-based routes, dynamic imports/globs, asset URLs, filename-based discovery, and documentation
  links. Search for both full paths and relevant filename or directory fragments.
- Existing destinations, other planned moves, and case-insensitive collisions. Inspect directory
  contents, including hidden and untracked files, before moving a whole directory.

Preserve public import paths, URLs, and package boundaries. If a correction would change an
external contract and no compatible move is available, prepare the mapping and resolve that
migration decision before applying it. For an audit-only request, return the findings and mapping
here without editing files or running commands that generate output in the project.

## Apply and verify

Apply the unambiguous moves with path-safe operations that refuse overwrites. Use an unused
temporary path for case-only renames when required. Move files without discarding local edits or
changing the user's staging selection; do not stage, commit, or push unless requested. If moving
a partially staged file cannot preserve that selection, leave that move pending and explain why.
Keep symlinks as links and stay within the requested scope; report external targets without
relocating their contents. Remove only directories emptied by these moves, never unknown files
as cleanup.

Update affected references in the same change, including relative imports from the new location.
Regenerate derived files through the project's own tooling and follow its tracked-output rules.
Update architecture documentation only where it describes the changed layout. Keep unrelated
code, dependencies, and formatting intact.

Run the project's relevant checks for the affected consumers: type-checking, tests, build or
package checks as appropriate. Reuse existing coverage for pure moves; add regression coverage
when path-based behavior changes. Verify every mapped destination and its contents, search for
stale references, and review the diff for accidental deletions or unrelated edits. If an operation
fails, inspect the actual paths before retrying; report partial moves and failed or unavailable
checks instead of claiming completion.

Return the rules used, completed old-to-new path mapping (or no changes needed), unresolved
findings, and checks run. Include a small resulting tree only when it helps explain the changes.
