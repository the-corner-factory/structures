# AGENTS.md

**Path:** `AGENTS.md`\
**Role:** Repository instructions for coding agents

## Purpose

Give agents a short entry point to the project's working rules: where to find context, how to
validate changes, and which boundaries and exceptions matter in this repository.

## Guidelines

- Document commands and constraints that are specific to the project and keep them current.
- Link to `GLOSSARY.md` for terminology, `PRODUCT.md` for product intent, and `DESIGN.md` for
  interface guidance when those documents are relevant to the task.
- Keep task-specific detail in focused guides directly under `.agents/`, such as `frontend.md`
  or `validation.md`, and state when each guide should be read.
- Keep executable workflows in skills and structured skill configuration in `.agents/configs/`.
- Preserve narrower directory guidance and explicit user requirements when they apply.
- Check the agent host's supported instruction-file names and scopes; `AGENTS.md` is not an
  application runtime configuration file.
