# example.md

**Path:** `.agents/example.md`\
**Role:** Agent-specific project guidance

## Purpose

Document configuration or conventions that an agent needs for a particular task or area of the
project. Rename this example to describe its topic, such as `frontend.md` or `validation.md`.

## Guidelines

- Keep each guide focused on one topic and link to existing sources instead of duplicating them.
- Add a pointer in the root `AGENTS.md` that states when the agent should read this guide.
- Store structured skill settings under `.agents/configs/<skill>/` when the skill defines that path.
- Keep repeatable workflows and their supporting resources under `.agents/skills/`.
- Check the host's discovery rules. An arbitrary Markdown file is read only when referenced or
  explicitly loaded; its presence does not configure an agent automatically.
- Commit shared guidance and keep credentials and local session state outside this file.

## Example content

```markdown
# Frontend guidance

Read this guide when changing the frontend.

- Reuse the project's existing components and styling conventions.
- Follow the validation commands documented in the root AGENTS.md.
- Update visible states and accessible labels when changing interactions.
```

Keep repository-wide instructions in `AGENTS.md`; use this file for the details needed by its topic.
