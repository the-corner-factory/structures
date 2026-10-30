# Structures website profile, version 1

This is the website-wide profile, not a legacy folder catalog or portable explorer prop.
Store the local template as `.agents/configs/.structures/config.json`; the website/Gist export filename is exactly
`settings.json`. Both use UTF-8 JSON with two-space indentation and a final newline.
Local templates add the path constraints in [the template contract](template.md).
Inline Markdown is JSON string content, not separate files. This contract follows
[Structures' website settings documentation](https://github.com/the-corner-inc/structures/blob/main/docs/site-settings.md).

## Folders and documentation

Required export fields are `version: 1` and `folders`:

```json
{
  "version": 1,
  "folders": {
    "libraryName": "Example project",
    "structures": [
      {
        "id": "project",
        "name": "Example project",
        "type": "container",
        "children": [{ "id": "project-readme", "name": "README.md", "type": "file" }]
      }
    ],
    "documentation": {
      "project": "# Example project\n\nDescribe the verified architecture here.\n",
      "project-readme": "# README.md\n\n`README.md` contains project setup instructions.\n"
    }
  }
}
```

`libraryName` is a nonempty display name; custom profiles need not match a built-in asset directory.
Every node has a nonempty `name`, `type` of `container`, `folder`, or `file`, and optional `children`
array. Files cannot have nonempty children. `color` and `bgColor`, if used, are CSS color strings.
Website nodes may also have string `description` and `example` fields.
An optional `folders.manifestConfig` must be a JSON object; omit it unless custom Material icon
configuration is needed by the guide.

The website accepts `id ?? name`; generated guides use explicit `id` on every node. IDs are globally
unique within a tree ignoring case, nonempty single path segments, excluding `/`, `\`, control
characters, `.` and `..`. Repeated display names need distinct IDs. A path-derived ID is an identity,
not a path field: the actual repository path belongs in its Markdown. Detect collisions after
replacing separators. Preserve stable IDs when refreshing a guide.

`documentation` maps lowercase node IDs to Markdown strings. All keys must identify existing nodes;
case-only duplicates are invalid. This skill requires nonempty documentation for every exported
node, including overview containers. Missing documents cannot fall back to built-in content or
adjacent Markdown. Raw HTML is skipped by the website renderer.

## Optional naming

All fields of `naming` are optional:

- `title`, `intro`: strings.
- `types`: array of `{ "prefix", "description", "example", "tone" }`. `prefix` is nonempty;
  `description` and `example` are strings; `tone` is an optional CSS color string.
- `example`: `{ "title", "description" }`, both strings.
- `rules`: array of `{ "title", "description" }`, both strings.

Omitted fields inherit built-in values; supplied arrays replace whole lists. Use empty arrays when
necessary to prevent built-in conventions from being presented as custom project policy. Commit
examples illustrate a format; distinguish them from real delivered changes.

## Optional Agentic overrides

`agentic` maps existing concept IDs to overrides. Supported IDs are `harness`, `plugins`, `agents`,
`mcp-servers`, `skills`, `instructions`, `tools`, `hooks`, `prompt`, `artifacts`, `agents-md`,
`context-md`, `design-md`, and `product-md`. `context-md` represents `GLOSSARY.md`; retain that ID.

Overrides may contain string `name`, `kind`, `description`, `distinction`, `source`, `sourceLabel`,
and `readme`. `source` must be an absolute HTTP(S) URL without credentials. `readme` is Markdown used
for both preview and download. Omitted fields retain built-in values. There are no custom concept
IDs, relationships, or geometry fields.

## Other sections, only with evidence

`logo` has required absolute HTTP(S) `url` without credentials, optional same-format `darkUrl`, and
optional nonempty `alt`. Preserve original branding; omit a logo unless chosen by the user.

`branches` has nonempty `libraryName`, optional string `description`, a `branches` array, and optional
`edges` array. Each branch has unique single-segment `id`, `kind` from `trunk`, `integration`,
`feature`, `fix`, `release`, or `other`, and optional string `label`, `color`, `description`, and
boolean `protected`. Edges are `{ "from", "to" }` references to existing IDs; duplicates, self-edges,
and unknown references are invalid. Remote branch names alone do not establish a branching policy.

`issues` uses the folder tree contract with a separate identity namespace. Root group display names
`types`, `labels`, and `Kanban` are matched ignoring case and surrounding spaces. Leaves under
`types` and `labels` supply label choices; direct `Kanban` children supply status choices.
Priority nodes can have string `description` and `example` fields.

`issues.examples`, if included, contains `{ "number", "title", "open", "author", "openedDaysAgo",
"comments", "labels", "status" }`. `number` is a unique positive integer; `title` and `author` are
nonempty strings; `open` is boolean; `openedDaysAgo` and `comments` are nonnegative integers;
`labels` is an array of unique leaf ID references; optional `status` references a direct `Kanban`
child. References resolve ignoring case. Examples must be labeled illustrative and contain no real
personal data. A supplied issue section replaces the built-in taxonomy, examples, and documentation
as a unit. Omit examples or use `[]` for none. Status derives from issues; no `status` top-level field.

## Loading and validation

All content sections are optional to the website; omitted sections retain built-in content.
State omissions in the overview. Do not copy built-in policies into the project profile as findings.

Paste the ordinary Gist page URL into **Website settings URL** and choose **Load**. GitHub's API
resolves the Gist file named `settings.json`. Raw JSON URLs also work; other hosts must allow browser
requests through CORS. The website validates the whole profile before applying custom sections.
The URL is retained in `?settings=...`; sharing a resulting page shares that profile selection.

The bundled documentation checker validates folder fields, node shape, IDs, and Markdown coverage.
For complete validation in a Structures checkout, import `parseSiteSettings` from
`src/lib/site-settings.ts` with the project's Vite+/Vitest runner and assert it accepts the generated
JSON. Otherwise check optional field types and references using this contract and report the
validation limit. Do not claim the website parser ran unless it did.
