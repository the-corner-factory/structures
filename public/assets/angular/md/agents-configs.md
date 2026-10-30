# configs

**Path:** `.agents/configs`\
**Role:** Project configuration for skills

## Purpose

Store project-specific configuration for different skills. Each skill owns a separate directory,
such as `.structures/` for the Structures folder and module-naming template.

## Guidelines

- Use the directory and filenames declared by each skill; keep different skills' settings separate.
- Keep workflow instructions and bundled resources in `.agents/skills/` or `.agents/plugins/`.
- Commit shared project conventions; keep credentials and local session data out of these files.
- A skill must explicitly read its configuration path; this directory does not enable discovery.

## Example layout

```text
.agents/configs/
└── .structures/
    └── config.json
```

Application configuration belongs in its framework's own locations.
