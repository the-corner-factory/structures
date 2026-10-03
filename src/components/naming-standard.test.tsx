// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";

import { NamingStandard } from "./naming-standard.tsx";
import { useSiteSettings } from "./site-settings-provider.tsx";

vi.mock("./site-settings-provider.tsx", () => ({ useSiteSettings: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

beforeEach(() => {
  vi.mocked(useSiteSettings).mockReturnValue({ isPending: false, error: null, refetch: vi.fn() });
});
afterEach(() => cleanup());

it("applies naming fields and replaces supplied lists while keeping omitted defaults", () => {
  vi.mocked(useSiteSettings).mockReturnValue({
    settings: {
      version: 1,
      naming: {
        title: "Team commits",
        intro: "Describe the change for future maintainers.",
        types: [{ prefix: "ship", description: "Deliver a change.", example: "ship: update docs" }],
        example: { title: "ship: publish guide", description: "The guide explains our workflow." },
      },
    },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  });
  render(<NamingStandard />);
  expect(screen.getByRole("heading", { name: "Team commits", level: 1 })).toBeTruthy();
  expect(screen.getByText("Describe the change for future maintainers.")).toBeTruthy();
  expect(screen.getByText("ship: publish guide")).toBeTruthy();
  expect(screen.getByText("The guide explains our workflow.")).toBeTruthy();
  expect(screen.getByText("ship: update docs")).toBeTruthy();
  expect(screen.queryByText("feat")).toBeNull();
  expect(screen.getByRole("heading", { name: "Connect commits to the issue" })).toBeTruthy();
});

it("honors intentionally empty type and rule lists", () => {
  vi.mocked(useSiteSettings).mockReturnValue({
    settings: { version: 1, naming: { types: [], rules: [] } },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  });
  const { container } = render(<NamingStandard />);
  expect(screen.getByRole("heading", { name: "Conventional commits", level: 1 })).toBeTruthy();
  expect(container.querySelectorAll(".naming-type-card, .naming-section-card")).toHaveLength(0);
  expect(screen.getByText("fix(auth): refresh session before token expires")).toBeTruthy();
});
