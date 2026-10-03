// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";

import githubFlow from "../../public/assets/github-flow/settings.json";
import gitlabFlow from "../../public/assets/gitlab-flow/settings.json";
import { parseBranchFlow } from "../lib/branches.ts";
import { BranchFlowPage } from "./branch-flow-page.tsx";
import { useSiteSettings } from "./site-settings-provider.tsx";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("./site-settings-provider.tsx", () => ({ useSiteSettings: vi.fn() }));
// Match the app's React deduplication for the vendored renderer.
vi.mock("../../packages/gitgraph-react/node_modules/react", () => import("react"));

beforeEach(() => {
  vi.mocked(useSiteSettings).mockReturnValue({ isPending: false, error: null, refetch: vi.fn() });
  navigate.mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(SVGElement.prototype, "getBBox");
});

it("renders the global branch flow without fetching or offering another strategy", async () => {
  const fetch = vi.spyOn(globalThis, "fetch");
  Object.defineProperty(SVGElement.prototype, "getBBox", {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 200, height: 500 }),
  });
  const flow = { ...parseBranchFlow(githubFlow), libraryName: "Team branching" };
  vi.mocked(useSiteSettings).mockReturnValue({
    url: "https://example.com/settings.json",
    settings: { version: 1, branches: flow },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  });
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <BranchFlowPage sourceOverride="legacy" flow="git-flow" />
    </QueryClientProvider>,
  );
  expect(await screen.findByRole("heading", { name: "Team branching" })).toBeTruthy();
  expect(await screen.findByRole("img", { name: "main branch" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Change strategy" })).toBeNull();
  expect(screen.queryByText("Loading strategy…")).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  client.clear();
});

it("ignores legacy sources with global settings and selects built-in presets through flow", () => {
  const fetch = vi.spyOn(globalThis, "fetch");
  const url = "https://example.com/settings.json";
  vi.mocked(useSiteSettings).mockReturnValue({
    url,
    settings: { version: 1 },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  });
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <BranchFlowPage sourceOverride="legacy" />
    </QueryClientProvider>,
  );
  expect(screen.getByRole("heading", { name: "Explore a branching strategy" })).toBeTruthy();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "GitHub Flow" }));
  const options = navigate.mock.calls[0][0];
  expect(options.to).toBe("/branches");
  expect(options.resetScroll).toBe(false);
  expect(options.search({ settings: url, source: "legacy" })).toEqual({
    settings: url,
    source: undefined,
    flow: "github-flow",
  });
  client.clear();
});

it("shows strategy-specific descriptions for branch paths, dots, labels, and keyboard focus", async () => {
  Object.defineProperty(SVGElement.prototype, "getBBox", {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 200, height: 500 }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(["branch-flow", "gitlab"], parseBranchFlow(gitlabFlow));
  client.setQueryData(["branch-flow", "github"], parseBranchFlow(githubFlow));
  const page = (source: string) => (
    <QueryClientProvider client={client}>
      <BranchFlowPage sourceOverride={source} />
    </QueryClientProvider>
  );
  const view = render(page("gitlab"));
  const sidebar = within(screen.getByRole("complementary", { name: "Branch description" }));
  const mainPath = await screen.findByRole("img", { name: "main branch" });
  const description = gitlabFlow.branches[0].description;

  expect(sidebar.getByText(gitlabFlow.description)).toBeTruthy();
  fireEvent.pointerOver(mainPath);
  expect(sidebar.getByText(description)).toBeTruthy();
  expect(sidebar.queryByText(gitlabFlow.description)).toBeNull();
  fireEvent.pointerLeave(view.container.querySelector(".branch-graph")!);
  expect(sidebar.queryByText(description)).toBeNull();
  expect(sidebar.getByText(gitlabFlow.description)).toBeTruthy();

  fireEvent.pointerOver(view.container.querySelector('g[data-branch="main"] > g > use')!);
  expect(sidebar.getByText(description)).toBeTruthy();
  const mainCommit = screen.getByRole("img", { name: "Commit 1 on main" });
  expect(within(screen.getByRole("tooltip")).getByText(description)).toBeTruthy();
  expect(mainCommit.getAttribute("aria-describedby")).toBe(screen.getByRole("tooltip").id);
  fireEvent.pointerLeave(view.container.querySelector(".branch-graph")!);
  fireEvent.pointerOver(screen.getByRole("tooltip"));
  expect(screen.getByRole("tooltip")).toBeTruthy();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("tooltip")).toBeNull();
  expect(mainCommit.hasAttribute("aria-describedby")).toBe(false);

  fireEvent.focus(mainCommit);
  expect(within(screen.getByRole("tooltip")).getByText(description)).toBeTruthy();
  fireEvent.blur(mainCommit);
  expect(screen.queryByRole("tooltip")).toBeNull();

  const mergeCommit = screen.getByRole("img", { name: "Merge feature/* into main" });
  fireEvent.focus(mergeCommit);
  expect(within(screen.getByRole("tooltip")).getByText("Merge feature/* into main")).toBeTruthy();
  expect(
    within(screen.getByRole("tooltip")).getByText(gitlabFlow.branches[1].description),
  ).toBeTruthy();
  fireEvent.blur(mergeCommit);

  fireEvent.pointerOver(screen.getByText("feature/*", { selector: "svg text" }));
  expect(sidebar.getByText(gitlabFlow.branches[1].description)).toBeTruthy();
  fireEvent.focus(mainPath);
  expect(sidebar.getByText(description)).toBeTruthy();
  fireEvent.focus(mainCommit);

  view.rerender(page("github"));
  expect(screen.queryByRole("tooltip")).toBeNull();
  expect(sidebar.queryByText(description)).toBeNull();
  expect(sidebar.getByText(githubFlow.description)).toBeTruthy();
  await waitFor(() => expect(screen.queryByRole("img", { name: "production branch" })).toBeNull());
  fireEvent.focus(await screen.findByRole("img", { name: "main branch" }));
  expect(sidebar.getByText(githubFlow.branches[0].description)).toBeTruthy();
  fireEvent.blur(screen.getByRole("img", { name: "main branch" }));
  expect(sidebar.queryByText(githubFlow.branches[0].description)).toBeNull();
  expect(sidebar.getByText(githubFlow.description)).toBeTruthy();
  fireEvent.pointerOver(screen.getByRole("img", { name: "Commit 1 on main" }));
  fireEvent.pointerLeave(view.container.querySelector(".branch-graph")!);
  await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  client.clear();
});
