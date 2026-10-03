// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import type { SiteSettings } from "#/lib/site-settings.ts";

import { PrioritiesStandard } from "./priorities-standard";
import { StructureBoard } from "./structure-board";

const navigate = vi.hoisted(() => vi.fn());
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
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => navigate,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

const profile: SiteSettings = {
  version: 1,
  issues: {
    libraryName: "team",
    structures: [
      {
        name: "labels",
        type: "folder",
        children: [
          {
            name: "priority",
            type: "folder",
            children: [
              {
                id: "urgent",
                name: "Immediate",
                type: "file",
                color: "#ff0000",
                description: "Interrupt other work.",
                example: "The release is blocked.",
              },
            ],
          },
        ],
      },
      {
        name: "types",
        type: "folder",
        children: [
          {
            name: "Delivery",
            type: "folder",
            children: [{ id: "task", name: "Task", type: "file" }],
          },
        ],
      },
      {
        name: "Kanban",
        type: "folder",
        children: [{ id: "review", name: "Approval", type: "file" }],
      },
    ],
    documentation: {
      review: "# Approval workflow\n\nRequest a second pair of eyes.",
      task: "# Delivery task\n\nA concrete piece of work.",
    },
  },
};

afterEach(() => {
  cleanup();
  settings = undefined;
  vi.clearAllMocks();
});

describe("global issue profile", () => {
  it("uses custom priority content and avoids built-in priority levels", () => {
    settings = profile;
    render(<PrioritiesStandard />);
    expect(screen.getByText("Immediate")).toBeTruthy();
    expect(screen.getByText("Interrupt other work.")).toBeTruthy();
    expect(screen.getByText("The release is blocked.")).toBeTruthy();
    expect(screen.queryByText("P0")).toBeNull();
    expect(screen.queryByText(/A P0 should/)).toBeNull();
  });

  it("uses built-in priorities when the issues section is omitted", () => {
    settings = { version: 1 };
    render(<PrioritiesStandard />);
    expect(screen.getByText("P0")).toBeTruthy();
    expect(screen.getByText("P4")).toBeTruthy();
  });

  it("renders priority leaves nested beneath a category", () => {
    settings = {
      version: 1,
      issues: {
        libraryName: "team",
        structures: [
          {
            name: "labels",
            type: "folder",
            children: [
              {
                name: "priority",
                type: "folder",
                children: [
                  {
                    name: "Escalations",
                    type: "folder",
                    children: [
                      {
                        id: "urgent",
                        name: "Immediate",
                        type: "file",
                        description: "Interrupt other work.",
                        example: "The release is blocked.",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    render(<PrioritiesStandard />);
    expect(screen.getByText("Immediate")).toBeTruthy();
    expect(screen.getByText("Interrupt other work.")).toBeTruthy();
    expect(screen.getByText("The release is blocked.")).toBeTruthy();
    expect(screen.queryByText("Escalations")).toBeNull();
  });

  it("shows the empty priority state for a custom tree without priorities", () => {
    settings = { version: 1, issues: { libraryName: "team", structures: [] } };
    render(<PrioritiesStandard />);
    expect(screen.getByText("No priority levels are configured.")).toBeTruthy();
    expect(screen.queryByText("P0")).toBeNull();
  });

  it("shares status and documentation with the issue profile and keeps navigation context", () => {
    settings = profile;
    render(
      <StructureBoard variant="kanban" sourceOverride="https://old.example.com/settings.json" />,
    );
    expect(screen.queryByRole("textbox", { name: "Structure settings URL" })).toBeNull();
    const column = screen.getByRole("button", { name: "Approval" });
    fireEvent.focus(column);
    expect(screen.getByText("Request a second pair of eyes.")).toBeTruthy();
    fireEvent.click(column);
    const destination = navigate.mock.calls[0][0];
    expect(destination.params).toEqual({ library: "team", element: "review" });
    expect(
      destination.search({ q: "approval", settings: "https://example.com/settings.json" }),
    ).toEqual({ q: "approval", settings: "https://example.com/settings.json", source: undefined });
  });

  it("renders labels from the same tree and reports missing inline documentation", () => {
    settings = { ...profile, issues: { ...profile.issues!, documentation: {} } };
    render(<StructureBoard variant="labels" />);
    fireEvent.focus(screen.getByRole("button", { name: "Task" }));
    expect(screen.getByText("No description found")).toBeTruthy();
  });

  it("renders direct labels as interactive pills alongside nested groups", () => {
    settings = {
      version: 1,
      issues: {
        libraryName: "team",
        structures: [
          {
            name: "types",
            type: "folder",
            children: [
              { id: "task", name: "Task", type: "file" },
              {
                name: "Delivery",
                type: "folder",
                children: [{ id: "fix", name: "Fix", type: "file" }],
              },
            ],
          },
        ],
        documentation: { task: "# Delivery task\n\nA concrete piece of work." },
      },
    };
    render(<StructureBoard variant="labels" />);
    expect(screen.getByRole("button", { name: "Fix" })).toBeTruthy();
    fireEvent.focus(screen.getByRole("button", { name: "Task" }));
    expect(screen.getByText("A concrete piece of work.")).toBeTruthy();
  });
});
