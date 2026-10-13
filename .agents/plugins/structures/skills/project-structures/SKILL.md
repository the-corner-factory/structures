---
name: project-structures
description: Analyze a project's architecture and generate a Structures website settings.json with inline documentation and a Markdown overview, optionally publishing both as a GitHub Gist. Use for documenting project organization or creating a Structures profile from a codebase.
license: MIT
compatibility: Requires file access and Node.js 24.15+ (24.x) or 26+ to run the bundled checker. Publishing requires an authenticated GitHub Gist tool or GitHub CLI.
---

# Project structures

Produce a curated, evidence-based architecture guide that can be loaded in the Structures website.
Create local `settings.json` and `<project>-structures.md` files; publish a Gist only when requested.
Use the bundled format and example. Resolve bundled paths relative to this `SKILL.md`, not the
project being inspected. The workflow works in any Agent Skills host with file and shell access.

## Inspect the project

Resolve the requested project roots, using the current workspace when none is specified. For a
multi-repository system, inspect each requested repository and give each its own subtree.
Read applicable instructions, architecture/glossary documents, package manifests, and build/test
configuration. Inventory tracked source with `git ls-files` or use `rg --files` outside Git.
Read representative entry points and their callers until you can explain the real ownership and
data flow between UI, transport, business logic, persistence, and shared infrastructure, as applicable.
Separate documented policy, observed implementation, and inference when they disagree.

Select directories and files that explain boundaries, important features, shared contracts,
configuration, tests, and deployment. Expand representative features far enough to show a real
request or execution path. Summarize repetitive siblings; say explicitly that the map is curated.
Use actual paths and names. Treat example projects, generated output, dependencies, and vendor
code according to their role rather than as the application's architecture.

Record each Git repository's commit and working-tree state; mark a non-Git project or repository
without commits as unversioned and use local paths. Pin source links to the inspected commit
when the remote host supports it. Verify each linked path exists at that commit; describe local
changes separately, with local paths rather than misleading commit links. Keep credentials out of
remote URLs. If a host's browse URL cannot be established, use a relative path instead of guessing.

## Generate the guide

Read [the profile contract](references/profile-format.md). Adapt
[the bundled example](assets/settings.example.json) to the inspected project; its names and
conventions are illustrative, not defaults for the target project.

Write both files to a fresh output directory outside tracked source unless the user chose a
destination. Keep existing source and output files intact. `settings.json` must be the exact JSON
filename so ordinary Gist page links resolve in Structures.

- Create `version: 1` and a `folders` section. Give every node an explicit, stable, globally unique
  ID and inline Markdown documentation keyed by its lowercase ID. Derive IDs from repository and
  relative path, replacing path separators and resolving collisions. Preserve existing IDs on
  updates when they still identify the same node.
- Document each selected node's actual path, purpose, ownership, and relevant neighbors. Use a
  short explanation for simple files, deeper guidance for architectural boundaries, and verified
  source links when available. Explain a representative flow in the project overview.
- Include `naming` and `agentic` overrides only where repository evidence supports them. Keep
  current implementation distinct from a proposed migration. Omit unsupported sections; explicitly
  state that omitted sections display Structures' built-in examples, which are not project policy.
  Add a logo only when the user provides or selects one.
- The Markdown overview states project scope, inspection date, repository baselines, architecture,
  placement rules, verification commands found in the project, coverage, and limitations. Include
  steps to paste the Gist page URL into **Website settings URL**, choose **Load**, then **Folders**.
  Explain that the JSON carries all its documentation and needs no separate Markdown server.

Keep exported content to architecture facts needed for this guide. Exclude credentials, environment
values, private user/customer data, and copied implementation bodies. Private repository names,
paths, source links, and architecture can also be sensitive; respect the requested sharing scope.

## Validate

Run the bundled checker from its installed skill directory, using absolute paths:

```sh
node <skill-directory>/scripts/check-documentation.mjs <output-directory>/settings.json
```

It checks folder fields, node shape, identity, and complete documentation coverage. Check any optional
sections against the bundled contract too. When a Structures checkout is available, validate the
whole profile with its `parseSiteSettings` function through the existing Vite+/Vitest tooling.
Report which validation actually ran; the documentation checker alone is not full profile validation.

Verify all selected paths against the inspected repositories, documentation claims against source,
and source links against the recorded baselines. Application tests are unnecessary for an export;
report that they were not run. Finish only once both files exist, checks pass, and uncertainties and
omitted sections are stated in the overview.

## Publish when requested

A request to generate Gist-ready files does not by itself request an upload. If the user requests
publishing, use their specified account, target Gist, and visibility. When visibility is unspecified,
use a secret Gist and explain that secret means unlisted, readable by anyone with the link. If a
private project's permitted sharing scope is unclear, finish the local files before asking about
uploading those concrete files. Never treat secret Gists as access-controlled storage.

Prefer an available authenticated Gist tool. Otherwise use GitHub CLI when installed and
authenticated, passing the two explicit file paths:

```sh
gh gist create <output-directory>/settings.json <output-directory>/<project>-structures.md \
  --desc '<project> architecture and Structures profile'
```

Add `--public` only for explicitly requested public visibility. For a requested update, inspect the
target Gist first, then update only these filenames using the supported tool or `gh gist edit`.
Preserve other files. If creation returns an ambiguous result, inspect recent Gists for these
filenames and content before retrying, to avoid duplicates.

If publishing is unavailable, return the completed files and the missing setup requirement.
After publishing, read the Gist back and compare both files to the local output. Return the verified
Gist URL, loading instructions, coverage, checks, and material limitations.
