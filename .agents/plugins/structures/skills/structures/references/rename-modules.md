# TypeScript module naming

Use this workflow for source-file naming requests, including `audit modules [path]`,
`rename modules [path]`, and `set module naming rules`. Cover `.ts`, `.tsx`, `.mts`, `.cts`,
and declaration files together with their tests and companion templates/styles. A module here
is a source file, not specifically an Angular NgModule. Content assets use [Assets](rename-assets.md).

## Establish and retain the rules

Read [the template contract](template.md), repository instructions, framework configuration,
and representative modules in the requested scope. Read implementations and callers to identify
roles; a filename alone does not establish that a file is a store, service, or component.
Use explicit user requirements and repository rules, then the saved template; infer conventions
from consistent peers only where those sources are silent. Report conflicts with concrete alternatives
before changing the affected rule or files. Continue independent, unambiguous work.

Save module conventions in a **Module naming rules** section of the relevant folder's inline
`folders.documentation` entry in `.agents/configs/.structures/config.json`. Use the root entry for project-wide
rules and document narrower exceptions beside their folder. Record:

- Scope, basename casing, and role suffixes, with a conforming example.
- Companion naming and grouping, such as colocated tests or a folder for each page's files.
- Framework-required names, generated/vendor exclusions, and intentional exceptions.

Use the existing profile format; `naming` describes commit conventions, not module policy.
A rule is documentation for the agent, not an executable glob, regex, or lint configuration.
Examples illustrate an adopted rule; they are not mandatory files to scaffold.

For `set module naming rules`, save the requested conventions without renaming files. For
`rename modules`, retain existing rules and save newly established scoped conventions before
applying them. If the template is missing, derive it from unambiguous local project rules using
[Template](template.md); the module-rule or rename request selects the local project as the source.
Validate the candidate before saving. Preserve existing IDs, unrelated documentation and profile
sections, and source provenance. Refreshes preserve these local naming rules and exceptions.
A single exact rename does not establish a project-wide convention: apply that rename without
inventing a general rule or creating a template solely for it. Persist a broader rule when the user
requests one or repository evidence establishes it. Ask only for unresolved policy decisions.

Audits and previews are read-only, including when the template is absent. Report the source of each
rule, proposed old/new paths, and ambiguities; recommend initialization when rules are not saved.
Folder audits and fixes also consult these saved naming and grouping rules, including for files
omitted from the curated tree. A fix applies policy; changing policy needs a rule-update request.

## Rename and verify

Use [Folders: map, apply and verify](folders.md#map-necessary-corrections) for collision checks,
working-tree preservation, path mapping, reference updates, and validation. A module-only naming
request keeps directory placement unless a requested or saved grouping rule requires a move.

Account for static and dynamic imports, re-exports and barrels, aliases, package exports,
TypeScript project references, test discovery, snapshots, globs, route loaders, and documentation.
Update companion `templateUrl`/`styleUrl` references when their paths change. Preserve extensions,
including `.d.ts`, `.spec.ts`, and `.test.tsx`, and runtime import conventions such as `.js` specifiers
that resolve to TypeScript sources. Trace these mappings instead of replacing every matching word.
Keep exported symbols and behavior unchanged unless explicitly requested. Framework route names
and published import paths are contracts: preserve them or resolve the migration before renaming.

Check for stale references and verify destination contents and imports. Run the project's relevant
type checks, existing tests, and build checks. Report the saved rule location, completed path mapping,
exceptions, and validation results. A successful template check validates structure and documentation;
it does not prove source files comply. No commit, release, or publication is implied.

## Examples with established rules

| Adopted rule                                                                   | Correction                                                                                                                  |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| In a project's shared phases, store modules use `<name>.store.ts`.             | `guest-draft-store.ts` becomes `guest-draft.store.ts`; update all consumers.                                                |
| In a guest feature, each page's source, template and spec share a page folder. | Move `workflow-guest-consultation.page.{ts,html,spec.ts}` into `consultation/`; update relative imports and the lazy route. |
| A React library uses kebab-case basenames and adjacent `.test.tsx` tests.      | Rename the component and matching test together; retain `.tsx` and exported symbols.                                        |

These examples are conditional on the project's rules; Angular suffixes and page folders are not
universal TypeScript requirements. Keep TanStack route filenames and other framework conventions.
