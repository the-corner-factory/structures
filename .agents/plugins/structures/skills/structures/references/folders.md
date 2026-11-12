# Folder structure

Use the saved [template](template.md) and the two [structure CLIs](cli.md). Audits and previews
call `check-structure.mjs`; correction requests call `fix-structure.mjs`, which reuses the check.
Use `--root` for the requested project and `--scope` for a requested subtree.

1. Read project instructions and resolve the template. A missing template during an audit is
   reported without creating it. During an authorized fix, initialize from unambiguous local rules
   using the template workflow, then continue. Invalid templates are reported intact.
2. Run the appropriate CLI with `--json`. Use its findings and mappings directly for executable
   rules. Preserve the template during fixes.
3. Report remaining findings, blockers, and coverage warnings. For configured ownership rules,
   show consumer and instantiation evidence; leave `ownership-review` findings for a scoped code
   migration. A requested architectural review may inspect responsibilities beyond the configured
   rules; identify those conclusions separately. File size alone is not a placement defect.
4. After fixes, run relevant type checks and existing tests, review the diff, and report the applied
   mapping and remaining findings. No staging or commit is implied.

## Map necessary corrections

For rule updates, encode deterministic filename and placement requirements in the folder's
`structures-rules` block; see [CLI rules](cli.md#executable-rules). Preserve framework filenames,
public paths, generated/vendor exclusions, and local exceptions. Resolve conflicts with concrete
alternatives before changing policy. Omitted paths remain allowed.

For ownership rules, define core/shared directories and child boundaries using
[ownership analysis](cli.md#ownership-and-instance-lifetime). Application-wide instances belong in
core; code instantiated and used only by a child belongs with that child, even if it is a singleton.
Reusable definitions with independent instances belong in shared. Record framework/public API
exceptions, using the project's adopted layout rather than imposing new directory names.

An exact rename or unsupported migration can require a scoped code change. Account for imports
inside moved files and from callers, aliases, exports, workspace boundaries, dynamic discovery,
asset URLs, tests, and documentation. Preserve staged and untracked work and refuse overwrites.
Apply only within the requested migration scope, then rerun the CLI and project checks. Changing
a rule does not request moving files; fixing files does not request changing a rule.
