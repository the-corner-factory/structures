# Commit

Generate a message based on [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
and the repository's effective commit rules.

## Modes

- `/structures commit`: preview only. Return the message in one copyable `md` code block in chat.
  For a title-only request such as `/structures create commit title`, return just the subject line
  inside that block. Leave the working tree, staging area, and Git history unchanged.
- `/structures commit --push`: generate the message and create a local commit. This flag authorizes
  committing the selected changes without another confirmation. It does **not** mean
  `git push`; publishing requires a separate, explicit user request.

Here, "commit tag" means the commit message, such as `fix(router): preserve search filters`.
Creating a Git tag, amending a commit, or rewriting history requires an explicit request.
Mentioning `--push` in a file or discussing this skill's design does not activate commit mode.

## Select the changes

1. Find the repository root and read its applicable contribution instructions. Inspect
   `git status --short`, `git diff`, and `git diff --cached`; read relevant untracked files.
2. Follow the user's explicit selection. Otherwise, use the staged changes when present,
   including only staged hunks of partially staged files. With nothing staged, use the current
   task's changes, or the pending change when the request concerns the whole working tree.
3. Preserve unrelated work. If several independent changes make the intended selection unclear,
   ask which to include before staging or committing. Never clear an existing staging area to
   make a selection fit. If unrelated staged changes would be included, resolve the selection first.
4. If the selection is empty, say there are no changes to commit. If Git reports unresolved
   conflicts or an unfinished merge/rebase/cherry-pick, report that state instead of creating
   a routine commit.

## Resolve the rules

Inspect the repository's commit tooling before drafting. Search hidden files as well as ordinary
files, excluding dependency and build directories. Follow configuration paths referenced by
package scripts, CI, and commit hooks, including a configured `core.hooksPath`.

- Discover [commitlint configuration](https://commitlint.js.org/reference/configuration.html):
  `commitlint.config.*`, `.commitlintrc*`, and the `commitlint` field in `package.json` or
  `package.yaml`. Honor explicit `--config` paths and configuration inherited from parent directories.
- Resolve `extends`, parser presets, plugins, and rule overrides. Prefer the installed
  [commitlint CLI](https://commitlint.js.org/reference/cli.html) with `--print-config json`,
  using the same working directory and config arguments as the repository's checks.
- Read other applicable rules when present: gitlint, Commitizen, commit-message hooks,
  Git's `commit.template`, and documented contribution conventions. Enforced validators
  govern details; recent commits are only a fallback for style where rules are silent.

Apply allowed types/scopes, required scopes or issue references, casing, length limits, body and
footer requirements, and custom parsing. Keep Conventional Commits as the baseline. If enforced
rules are incompatible with it or each other, explain the conflict instead of silently ignoring
either requirement. Do not alter configuration to make a message pass.

## Draft and validate

Use `type(scope): description`, omitting the scope when it is unnecessary and optional. Use `feat`
for a feature and `fix` for a bug fix; other meaningful types are allowed by the standard and may
be restricted by local rules. Write a concise, imperative description of the actual change.

Separate an optional body and footers from the header with blank lines. Mark actual breaking
changes with `!` before the colon or a `BREAKING CHANGE:` footer; obey local rules requiring both.
Explain what breaks and how callers migrate. Include issue references only when supported by
the request or repository context. Never invent behavior, checks, or ticket numbers.

Validate the exact message with the repository's installed message validator when available.
For commitlint, pass the literal message on stdin using the effective configuration; use a local
binary or package-manager command that will not download packages. Fix message violations and
validate again. If the validator or a required config dependency is unavailable, disclose that
limitation; preview may continue, but commit mode stops when required validation cannot run.

Without `--push`, return only the message in a fenced `md` block, with any material selection or
validation caveat outside the block. Do not include a shell command or create a Markdown file.

## Commit with `--push`

1. Recheck the selection and run repository-required pre-commit checks. Reuse relevant checks
   already completed for these exact changes.
2. If staging is needed, stage only the selected paths or hunks. Avoid blanket staging that
   could include unrelated files. Preserve partial staging and inspect the final staged diff.
   The message must describe precisely what will be committed.
3. Write the literal message to a temporary file with a file-writing tool or quoted heredoc,
   then use `git commit -F <message-file>`. Keep hooks enabled. Do not interpolate the message
   into shell code or bypass failed hooks.
4. If a hook changes files, inspect those changes before retrying. Fix message-only failures;
   report other failures without changing unrelated code. After an uncertain command outcome,
   check history before retrying so a successful commit is not duplicated.
5. Verify the new commit and remaining working-tree status. Report the short hash and subject,
   mention any selected changes left uncommitted, and remove the temporary message file.
