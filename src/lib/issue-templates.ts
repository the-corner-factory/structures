export interface IssueTemplate {
  id: string;
  name: string;
  description: string;
  body: string;
}

export const ISSUE_TEMPLATE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ISSUE_TEMPLATES: IssueTemplate[] = [
  {
    id: "general-task",
    name: "General task",
    description: "Describe a piece of work and what it means to finish it.",
    body: `## Summary

Describe the work and why it is needed.

## Desired outcome

What should be true when this task is complete?

## Acceptance criteria

- [ ] Describe an observable result that confirms the task is complete.

## Context

Link related issues, designs, or documentation. Note any constraints or dependencies.
`,
  },
  {
    id: "bug-report",
    name: "Bug report",
    description: "Explain what went wrong and how someone else can reproduce it.",
    body: `## Summary

Describe the bug and who it affects.

## Reproduction steps

1. Start from…
2. Perform…
3. Observe…

## Expected behavior

What should have happened?

## Actual behavior

What happened instead? Include the exact error message, if available.

## Environment

- Application version:
- Browser or runtime version:
- Operating system:

## Evidence

Add relevant screenshots, logs, or a minimal reproduction. Remove credentials and personal data.
`,
  },
  {
    id: "feature-request",
    name: "Feature request",
    description: "Describe a user need and the change that would address it.",
    body: `## Problem

Who needs this feature, and what are they unable to do today?

## Proposed solution

Describe the desired behavior and how someone would use it.

## Alternatives

What other approaches or workarounds have you considered?

## Acceptance criteria

- [ ] Describe an observable result that confirms the feature meets the need.
`,
  },
];

export function githubIssueTemplate(template: IssueTemplate): string {
  return `---\nname: ${JSON.stringify(template.name)}\nabout: ${JSON.stringify(template.description)}\n---\n\n${template.body}`;
}
