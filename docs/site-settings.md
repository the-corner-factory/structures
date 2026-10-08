# Website settings

Load one `settings.json` from the navigation to customize Folders, Issues, Naming, Status, Branches,
and Agentic together. Start with the [complete example](../public/settings.example.json), edit its
content, and save it as `settings.json` in a GitHub Gist.

Paste the Gist's ordinary page link or the raw JSON URL into **Website settings URL**, then choose
**Load**. Ordinary Gist links must identify a Gist containing a file named exactly `settings.json`;
the website resolves that file through GitHub's API. Other HTTP(S) JSON URLs work if they allow
browser requests through CORS. URLs containing credentials are rejected. No account is required.

The selected URL is stored in `?settings=<encoded URL>` and follows internal navigation. Share the
page URL to share the same profile, current page, and applicable filters. Reload and Back/Forward
restore that state; the profile is not saved in local storage. **Reset** returns to built-in content
and removes both `settings` and any legacy `source` parameter. Loading or resetting from an explorer
library/document URL returns to its topic root to clear the old selection while retaining `q`.

Settings load in the browser after hydration. The whole document must validate before any custom
section appears. Errors identify invalid fields; correct the Gist and load again, use **Try again**
after a request failure, or reset to the built-in standards. Reusing the same URL with **Load**
refreshes its content. Static/server-rendered page metadata remains available without fetching the
Gist on the server.

The explorer's settings panel downloads the complete active profile as `settings.json`, including
all sections and inline documentation. Without an active profile, it exports the current section
in its original catalog format.

## Document format

`version` is required and must be `1`. The logo and all five content sections are optional:

| Field      | Content                                                                      | When omitted                                           |
| ---------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| `logo`     | Navigation logo URL, optional dark-mode URL, and alternative text.           | The Corner logo remains visible.                       |
| `folders`  | One folder tree and inline Markdown documentation.                           | Built-in folder libraries remain available.            |
| `issues`   | One issue taxonomy, documentation, priority explanations, and sample issues. | Built-in issue examples and workflow remain available. |
| `naming`   | Naming title, introduction, commit types, worked example, and rules.         | Built-in naming guidance remains available.            |
| `branches` | One branch graph using the existing branch-flow format.                      | Built-in strategy chooser remains available.           |
| `agentic`  | Content overrides for existing concept/template IDs.                         | Built-in Agentic content remains available.            |

Status derives from `issues`; there is no separate `status` section. Even `{ "version": 1 }` is a
valid profile that retains every built-in section.

### Logo

Set `logo.url` to an absolute HTTP(S) image URL without credentials. It is used in light mode and
in both themes when `logo.darkUrl` is omitted. Supply an optional `logo.darkUrl` with the same URL
requirements to use a different image in dark mode. `logo.alt` supplies accessible alternative text
for both images and defaults to `Project logo` when omitted. This complete profile changes only the
navigation logo:

```json
{
  "version": 1,
  "logo": {
    "url": "https://assets.up4it.io/logos/up4it_logo.webp",
    "darkUrl": "https://assets.up4it.io/logos/up4it_logo-white.webp",
    "alt": "up4it"
  }
}
```

The logo appears after the full profile validates. It follows the site's active theme, including
its initial system preference, and switches immediately when the theme changes. The inactive image
is hidden from display and accessibility. Logos keep their original colors and fit within the
header. SVGs are loaded as images rather than injected into the page.
Omitting `logo` or choosing **Reset** restores The Corner logo.

### Folders and issues

Both sections require a nonempty `libraryName` and a `structures` array. An optional `manifestConfig`
object uses the existing Material Icon Theme configuration. Each tree node has:

| Field                    | Value                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| `name`                   | Nonempty display name.                                           |
| `type`                   | `container`, `folder`, or `file`.                                |
| `id`                     | Optional stable identity; defaults to `name`.                    |
| `children`               | Optional nested node array; files cannot have nonempty children. |
| `color`, `bgColor`       | Optional CSS color strings.                                      |
| `description`, `example` | Optional plain-text explanations used by priority cards.         |

IDs must be unique throughout the tree, ignoring case. They must be valid single path segments:
no slashes, backslashes, control characters, `.` or `..`. Give repeated display names distinct IDs.

`documentation` is an optional object mapping stable node IDs to Markdown strings. Keys are
normalized to lowercase; references must identify existing nodes, and keys that differ only by
case are rejected as duplicates. For example:

```json
{
  "libraryName": "team",
  "structures": [{ "id": "guide", "name": "README.md", "type": "file" }],
  "documentation": { "guide": "# Project guide\n\nDescribe setup here." }
}
```

The custom profile carries its own Markdown. Missing documentation displays an unavailable state;
it never fetches an unrelated built-in document or an adjacent `md/` file. Markdown retains the
website's existing safe renderer, which skips raw HTML.

### Issue workflow and examples

The issue tree uses these root group names, matched without regard to case or surrounding spaces:

- `types`: issue type labels, optionally nested into categories.
- `labels`: additional labels; its `priority` child supplies the priority page.
- `Kanban`: its direct children supply the Status columns, in array order.

Priority nodes may include `description` and `example` strings. Missing summaries and examples are
omitted. The priority page retains its layout and guidance.

`issues.examples` is an optional array of sample issues:

```json
{
  "number": 42,
  "title": "fix: restore checkout",
  "open": true,
  "author": "team",
  "openedDaysAgo": 1,
  "comments": 2,
  "labels": ["urgent", "bug"],
  "status": "ready"
}
```

Every field shown is required except `status`. Numbers must be unique positive integers;
`openedDaysAgo` and `comments` must be nonnegative integers. `title` and `author` must be nonempty.
`labels` may be empty and must reference leaf IDs under `types` or `labels`. `status`, when supplied,
must reference a direct child of `Kanban`. References resolve case-insensitively to the canonical
node ID; repeated labels and unresolved references are rejected. Display names and colors come
from the tree, so cards and Status use the same taxonomy.

A supplied `issues` section replaces the entire built-in issue profile. Omitting `examples` or
setting it to `[]` shows no sample issues. Custom labels never inherit the built-in sample issues
or documentation.

### Naming

All `naming` fields are optional and retain their built-in value when omitted:

- `title` and `intro`: plain-text page heading and introduction.
- `types`: array of `{ "prefix", "description", "example", "tone" }`; `tone` is an optional CSS
  color, and the other fields are strings with a nonempty `prefix`.
- `example`: `{ "title", "description" }` for the worked example.
- `rules`: array of `{ "title", "description" }` entries.

Supplied arrays replace the corresponding lists entirely. Use `[]` to deliberately remove a list.

### Branches

`branches` uses the existing branch-flow schema: nonempty `libraryName`, optional `description`,
`branches` array, and optional `edges` array. Each branch requires a unique stable `id` and a `kind`
from `trunk`, `integration`, `feature`, `fix`, `release`, or `other`. Optional fields are `label`
(defaults to the ID), `protected` (boolean), `color`, and `description`. Edges are `{ "from", "to" }`
references to branch IDs. Duplicate edges, self-edges, and unknown branch references are rejected.

### Agentic

`agentic` maps existing IDs to content overrides. Supported IDs are `harness`, `plugins`, `agents`,
`mcp-servers`, `skills`, `instructions`, `tools`, `hooks`, `prompt`, `artifacts`, `agents-md`, `context-md`,
`design-md`, and `product-md`.
The `context-md` ID selects `GLOSSARY.md` and is retained for existing links and profiles.

Each override may contain string fields `name`, `kind`, `description`, `distinction`, `source`,
`sourceLabel`, and `readme`. `source` must be an HTTP(S) reference URL without credentials; anchor
fragments are preserved. `readme` is Markdown and supplies both the preview and downloaded file.
Omitted fields keep their built-in values. Overrides preserve IDs, icons, relationships, and map
geometry; additional concept IDs are rejected.

## Existing links and reusable explorer

Legacy `?source=<URL>` links still load their existing per-page format when `settings` is absent.
Those legacy folder/issue sources retain their relative `md/<lowercase ID>.md` lookup. When both
parameters are present, website settings take precedence, including built-in fallback for sections
omitted from the profile.

Built-in branch selections now use `?flow=<preset>`, where the preset is `git-flow`, `github-flow`,
`gitlab-flow`, `trunk-based`, or `trunk-based-release`. A custom `branches` section overrides `flow`;
otherwise built-in strategy selection remains available. Invalid preset values return to the chooser.

This format belongs to the website. The portable shadcn explorer keeps its existing public API and
does not load a website profile or require the website's providers. See the
[registry guide](registry.md) for that component's contract.
