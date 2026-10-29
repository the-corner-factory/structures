import { describe, expect, it } from "vite-plus/test";

import { githubIssueTemplate, ISSUE_TEMPLATES } from "./issue-templates";
import { validateIssueSearch } from "./router-search";

describe("issue templates", () => {
  it("ships the three starter templates with their required sections", () => {
    expect(ISSUE_TEMPLATES.map(({ id }) => id)).toEqual([
      "general-task",
      "bug-report",
      "feature-request",
    ]);
    const sections = [
      ["Summary", "Desired outcome", "Acceptance criteria", "Context"],
      [
        "Summary",
        "Reproduction steps",
        "Expected behavior",
        "Actual behavior",
        "Environment",
        "Evidence",
      ],
      ["Problem", "Proposed solution", "Alternatives", "Acceptance criteria"],
    ];
    ISSUE_TEMPLATES.forEach((template, index) => {
      expect([...template.body.matchAll(/^## (.+)$/gm)].map((match) => match[1])).toEqual(
        sections[index],
      );
    });
  });

  it("quotes GitHub metadata without changing the Markdown body", () => {
    const template = {
      id: "team-bug",
      name: 'Team: "bug"',
      description: "First line\n---\nlabels: [admin]\nA \\ path",
      body: "## Summary\n\n  Keep this spacing.\n",
    };
    const file = githubIssueTemplate(template);
    const [open, name, about, close, blank, ...body] = file.split("\n");
    expect([open, close, blank]).toEqual(["---", "---", ""]);
    expect(JSON.parse(name.slice("name: ".length))).toBe(template.name);
    expect(JSON.parse(about.slice("about: ".length))).toBe(template.description);
    expect(body.join("\n")).toBe(template.body);
  });
});

describe("issue search", () => {
  it("preserves explorer filters and accepts custom template IDs", () => {
    expect(
      validateIssueSearch({ view: "templates", template: "team-task", q: "bug", source: "custom" }),
    ).toEqual({
      view: "templates",
      template: "team-task",
      q: "bug",
      source: "custom",
    });
  });

  it.each([null, 4, "../bug", "Bug", "bug--report", "", ["bug-report"]])(
    "ignores invalid view and template values: %j",
    (template) => {
      expect(validateIssueSearch({ view: "unknown", template }).view).toBeUndefined();
      expect(validateIssueSearch({ template }).template).toBeUndefined();
    },
  );
});
