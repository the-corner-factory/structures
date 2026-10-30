# config.json

**Path:** `.agents/configs/.structures/config.json`\
**Role:** Maintained folder and module-naming template

## Purpose

Record the project's intended folder layout, placement rules, and scoped module-naming conventions
for the Structures skill. The file uses the version-1 website profile format with a `folders` tree
and inline `documentation`.

## Guidelines

- Use one project-root container and literal file or folder names below it.
- Keep stable node IDs and explain each node's responsibility in its inline documentation.
- Place module-naming and companion-grouping rules in the relevant folder's documentation.
- Treat the tree as a curated guide: omitted paths are allowed and example files need not be created.
- Validate updates with the skill's `scripts/check-template.mjs` checker.
- Export `settings.json` for website or Gist use; maintain this file as the local source.
