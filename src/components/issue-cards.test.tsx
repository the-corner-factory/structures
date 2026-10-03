// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import type { IssueSettings, SiteSettings } from "#/lib/site-settings.ts";

import { IssueCards } from "./issue-cards";

const { navigate, fetchMarkdown } = vi.hoisted(() => ({
  navigate: vi.fn(),
  fetchMarkdown: vi.fn(),
}));
let settings: SiteSettings | undefined;

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
  vi.clearAllMocks();
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
