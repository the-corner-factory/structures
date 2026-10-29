// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { copyText } from "#/lib/clipboard.ts";
import { githubIssueTemplate, ISSUE_TEMPLATES } from "#/lib/issue-templates.ts";
import type { IssueSearch } from "#/lib/router-search.ts";
import type { IssueSettings, SiteSettings } from "#/lib/site-settings.ts";

import { IssueCards } from "./issue-cards";

const { navigate, fetchMarkdown } = vi.hoisted(() => ({
  navigate: vi.fn(),
  fetchMarkdown: vi.fn(),
}));
let settings: SiteSettings | undefined;
let search: IssueSearch = {};

vi.mock("#/lib/clipboard.ts", () => ({ copyText: vi.fn() }));

vi.mock("#/components/site-settings-provider.tsx", () => ({
  useSiteSettings: () => ({
    settings,
    url: settings ? "https://example.com/settings.json" : undefined,
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, className, children }: any) => (
    <a href={`#${to}`} className={className} onClick={(event) => event.preventDefault()}>
      {children}
    </a>
  ),
  useNavigate: () => navigate,
  useSearch: () => search,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ enabled, queryFn, queryKey }: any) => {
    if (!enabled || queryKey[0] === "structure-settings") {
      return { data: undefined, isPending: false, isError: false, error: null, refetch: vi.fn() };
    }
    try {
      return {
        data: queryFn({ signal: undefined }),
        isPending: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    } catch (error) {
      return {
        data: undefined,
        isPending: false,
        isError: true,
        error,
        refetch: vi.fn(),
      };
    }
  },
}));

// readme body per resolved label element id (see labelElementId in issue-cards.tsx)
const readmeByElement: Record<string, string> = {
  P1: "# P1\n\nHigh-priority item.",
  Feat: "# Feature\n\nAdds a new feature.",
  "In Review": "# In Review\n\nAwaiting review.",
  "To Do": "# To Do\n\nPrioritized, not started.",
  "On hold": "# On hold\n\nTemporarily paused.",
  Documentation: "# Documentation\n\nDocs-only change.",
};

vi.mock("#/lib/structures.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#/lib/structures.ts")>();
  return {
    ...actual,
    defaultSource: () => "/assets/software/",
    fetchMarkdown: (_source: string, element: string) => {
      fetchMarkdown(_source, element);
      const body = readmeByElement[element];
      if (!body) throw new Error(`No documentation was found for “${element}”.`);
      return body;
    },
  };
});

afterEach(() => {
  cleanup();
  settings = undefined;
  search = {};
  vi.clearAllMocks();
});

describe("issue template view", () => {
  it("previews and downloads the selected built-in, falling back for unavailable IDs", () => {
    search = { view: "templates", template: "bug-report" };
    const page = render(<IssueCards />);
    expect(screen.getByRole("button", { name: "Bug report", pressed: true })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Reproduction steps" })).toBeTruthy();
    expect(screen.queryByText("fix(auth): refresh session before token expires")).toBeNull();
    const download = screen.getByRole("link", { name: "Download .md" });
    expect(download.getAttribute("download")).toBe("bug-report.md");
    expect(decodeURIComponent(download.getAttribute("href")!)).toBe(
      `data:text/markdown;charset=utf-8,${githubIssueTemplate(ISSUE_TEMPLATES[1])}`,
    );
    search = { view: "templates", template: "missing" };
    page.rerender(<IssueCards />);
    expect(screen.getByRole("button", { name: "General task", pressed: true })).toBeTruthy();
  });

  it("copies only the body, resets feedback on content changes, and reports clipboard failure", async () => {
    search = { view: "templates" };
    const page = render(<IssueCards />);
    vi.mocked(copyText).mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByRole("button", { name: "Copy body" }));
    await screen.findByText("Issue body copied.");
    expect(copyText).toHaveBeenCalledWith(ISSUE_TEMPLATES[0].body);

    settings = {
      version: 1,
      issues: {
        ...customIssues,
        templates: [{ ...ISSUE_TEMPLATES[0], body: "## Team task\nNew body." }],
      },
    };
    page.rerender(<IssueCards />);
    expect(screen.queryByText("Issue body copied.")).toBeNull();
    expect(screen.getByRole("heading", { name: "Team task" })).toBeTruthy();
    vi.mocked(copyText).mockRejectedValueOnce(new Error("Denied"));
    fireEvent.click(screen.getByRole("button", { name: "Copy body" }));
    await screen.findByText(
      "Could not copy. Download the Markdown file to copy its body manually.",
    );
    expect(copyText).toHaveBeenLastCalledWith("## Team task\nNew body.");
  });

  it("replaces templates with custom content and keeps omitted or empty custom lists empty", () => {
    search = { view: "templates" };
    settings = {
      version: 1,
      issues: { ...customIssues, templates: [{ ...ISSUE_TEMPLATES[0], name: "Team task" }] },
    };
    const page = render(<IssueCards />);
    expect(screen.getByRole("button", { name: "Team task", pressed: true })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Bug report" })).toBeNull();
    for (const templates of [undefined, []]) {
      settings = { version: 1, issues: { ...customIssues, templates } };
      page.rerender(<IssueCards />);
      expect(screen.getByText("No issue templates are configured.")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Copy body" })).toBeNull();
      expect(screen.queryByRole("link", { name: "Download .md" })).toBeNull();
    }
    settings = { version: 1 };
    page.rerender(<IssueCards />);
    expect(screen.getByRole("button", { name: "General task", pressed: true })).toBeTruthy();
  });
});

const customIssues: IssueSettings = {
  libraryName: "team",
  structures: [
    {
      name: "labels",
      type: "folder",
      children: [
        {
          name: "priority",
          type: "folder",
          children: [{ id: "urgent", name: "Now", type: "file", color: "#ff0000" }],
        },
      ],
    },
    {
      name: "types",
      type: "folder",
      children: [{ id: "team-docs", name: "Docs", type: "file" }],
    },
    {
      name: "Kanban",
      type: "folder",
      children: [{ id: "review", name: "Awaiting approval", type: "file" }],
    },
  ],
  documentation: {
    urgent: "# Urgent work\n\nResolve this first.",
    "team-docs": "# Team documentation\n\nUse our documentation process.",
    review: "# Review workflow\n\nWait for a teammate.",
  },
  examples: [
    {
      number: 1,
      title: "docs: explain our release process",
      open: true,
      author: "team",
      openedDaysAgo: 1,
      comments: 0,
      labels: ["urgent", "team-docs"],
      status: "review",
    },
  ],
};

describe("issue cards label sidenav", () => {
  it("explains a hovered priority label in the sidebar using its readme", async () => {
    render(<IssueCards />);
    expect(screen.getByText("Conventional commit naming")).toBeTruthy();
    expect(screen.getByText("Hover a label to read what it means")).toBeTruthy();

    const labels = screen.getAllByRole("button", { name: "P1" });
    const p1 = labels[0];
    fireEvent.pointerEnter(p1);

    await waitFor(() => expect(screen.getByRole("heading", { name: "P1" })).toBeTruthy());
    expect(screen.getByText(/High-priority item/)).toBeTruthy();
  });

  it("explains a hovered status badge using its own readme", async () => {
    render(<IssueCards />);
    // The status is no longer a label pill; the only "In Review" control is the badge.
    expect(screen.queryAllByRole("button", { name: "In Review" }).length).toBeGreaterThan(0);
    fireEvent.pointerEnter(screen.getAllByRole("button", { name: "In Review" })[0]);
    await waitFor(() => expect(screen.getByText(/Awaiting review/)).toBeTruthy());
  });

  it("shows a no-description message for a missing readme", async () => {
    render(<IssueCards />);
    fireEvent.pointerEnter(screen.getAllByRole("button", { name: "CI" })[0]);
    await waitFor(() => expect(screen.getByText(/No description found/)).toBeTruthy());
  });

  it("resolves custom examples and inline documentation through canonical IDs", () => {
    settings = { version: 1, issues: customIssues };
    render(<IssueCards />);

    expect(screen.queryByRole("textbox", { name: "Structure settings URL" })).toBeNull();
    expect(screen.queryByText("fix(auth): refresh session before token expires")).toBeNull();
    const urgent = screen.getByRole("button", { name: "Now" });
    expect(urgent.style.color).toBe("rgb(255, 0, 0)");
    fireEvent.click(urgent);
    expect(navigate).toHaveBeenCalledWith({ to: "/issues/priorities" });

    fireEvent.pointerEnter(screen.getByRole("button", { name: "Docs" }));
    expect(screen.getByRole("heading", { name: "Team documentation" })).toBeTruthy();
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Awaiting approval" }));
    expect(screen.getByText("Wait for a teammate.")).toBeTruthy();
    expect(fetchMarkdown).not.toHaveBeenCalled();
  });

  it("shows an empty list when a custom issue profile omits examples", () => {
    settings = { version: 1, issues: { ...customIssues, examples: undefined } };
    render(<IssueCards />);
    expect(screen.getByText("No example issues are configured.")).toBeTruthy();
    expect(screen.queryByText("fix(auth): refresh session before token expires")).toBeNull();
  });

  it("does not fetch remote documentation when custom documentation is missing or empty", () => {
    settings = { version: 1, issues: { ...customIssues, documentation: { urgent: "" } } };
    render(<IssueCards />);
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Now" }));
    expect(screen.queryByText("No description found")).toBeNull();
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Docs" }));
    expect(screen.getByText("No description found")).toBeTruthy();
    expect(fetchMarkdown).not.toHaveBeenCalled();
  });
});
