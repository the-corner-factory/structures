# skills

**Path:** `.agents/skills`\
**Role:** Reusable agent workflows

## Purpose

Store project skills here, with one folder per task. A skill gives an agent instructions and
supporting material for work that should follow a repeatable process.

## Guidelines

- Give each skill a descriptive folder name, such as `review-changes`.
- Add a `SKILL.md` with YAML metadata containing `name` and `description`, followed by Markdown
  instructions. Match `name` to the folder name and describe when the skill should be used.
- Write concrete steps using the project's existing commands, conventions, and verification checks.
- Add `scripts/`, `references/`, or `assets/` inside a skill only when needed, and reference them
  from `SKILL.md`.
- Store project-specific skill configuration under `.agents/configs/`, using a separate directory
  for each skill, such as `.agents/configs/.structures/config.json`.
- Confirm that your agent tool supports this location and the capabilities the skill requires.

## Example layout

```text
.agents/skills/
└── review-changes/
    ├── SKILL.md
    └── references/
        └── review-checklist.md
```

`references/` is optional; the skill's instructions live in `SKILL.md`.
See the [Agent Skills specification](https://agentskills.io/specification) for the file format.
