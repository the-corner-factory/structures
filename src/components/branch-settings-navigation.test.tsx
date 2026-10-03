// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";

import {
  SiteSettingsBoundary,
  SiteSettingsProvider,
} from "#/components/site-settings-provider.tsx";
import { BRANCH_FLOWS, branchSource, parseBranchFlow, type BranchFlow } from "#/lib/branches.ts";
import type { SiteSettings } from "#/lib/site-settings.ts";
import { Route as RootRoute } from "#/routes/__root.tsx";
import { Route as BranchesRoute } from "#/routes/branches.tsx";

import githubFlow from "../../public/assets/github-flow/settings.json";

vi.mock("#/components/branch-graph.tsx", () => ({
  BranchGraph: ({ flow }: { flow: BranchFlow }) => <div>{flow.libraryName} diagram</div>,
}));

const settingsUrl = "https://example.com/settings.json";
const legacyUrl = "https://example.com/legacy.json";
const customUrl = "https://example.com/custom.json";
const clients: QueryClient[] = [];

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected network request"));
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.restoreAllMocks();
});

async function renderPage(url: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  clients.push(client);
  client.setQueryData<SiteSettings>(["site-settings", settingsUrl], { version: 1 });
  client.setQueryData<SiteSettings>(["site-settings", customUrl], {
    version: 1,
    branches: { ...parseBranchFlow(githubFlow), libraryName: "Team workflow" },
  });
  client.setQueryData(["branch-flow", legacyUrl], {
    ...parseBranchFlow(githubFlow),
    libraryName: "Legacy workflow",
  });
  for (const flow of BRANCH_FLOWS) {
    client.setQueryData(["branch-flow", branchSource(flow.dir)], {
      ...parseBranchFlow(githubFlow),
      libraryName: flow.name,
    });
  }
  const root = createRootRoute({
    validateSearch: RootRoute.options.validateSearch,
    search: RootRoute.options.search,
    component: () => (
      <SiteSettingsProvider>
        <SiteSettingsBoundary>
          <Outlet />
        </SiteSettingsBoundary>
      </SiteSettingsProvider>
    ),
  });
  const branch = createRoute({
    getParentRoute: () => root,
    path: "/branches",
    validateSearch: BranchesRoute.options.validateSearch,
    component: BranchesRoute.options.component,
  });
  const naming = createRoute({
    getParentRoute: () => root,
    path: "/naming",
    component: () => <h1>Naming</h1>,
  });
  const router = createRouter({
    routeTree: root.addChildren([branch, naming]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  await router.load();
  const page = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...page, router };
}

it.each(BRANCH_FLOWS)("restores the valid $dir preset directly from flow", async (flow) => {
  const { router } = await renderPage(`/branches?flow=${flow.dir}`);
  expect(await screen.findByRole("heading", { name: flow.name })).toBeTruthy();
  expect(router.state.matches.at(-1)?.search).toMatchObject({ flow: flow.dir });
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it("ignores invalid flow values and leaves the preset chooser available", async () => {
  const { router } = await renderPage("/branches?flow=unknown");
  expect(screen.getByRole("heading", { name: "Explore a branching strategy" })).toBeTruthy();
  expect(router.state.matches.at(-1)?.search).toMatchObject({ flow: undefined });
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it("retains global settings through preset selection, history, reload, and other routes", async () => {
  const page = await renderPage(`/branches?settings=${encodeURIComponent(settingsUrl)}`);
  expect(screen.getByRole("heading", { name: "Explore a branching strategy" })).toBeTruthy();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "GitHub Flow" })));
  expect(await screen.findByRole("heading", { name: "GitHub Flow" })).toBeTruthy();
  expect(page.router.state.location.search).toEqual({ settings: settingsUrl, flow: "github-flow" });

  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Change strategy" })));
  expect(screen.getByRole("heading", { name: "Explore a branching strategy" })).toBeTruthy();
  expect(page.router.state.location.search).toEqual({ settings: settingsUrl });
  await act(async () => page.router.history.back());
  await waitFor(() => expect(screen.getByRole("heading", { name: "GitHub Flow" })).toBeTruthy());
  await act(async () => page.router.history.forward());
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Explore a branching strategy" })).toBeTruthy(),
  );
  await act(async () => page.router.history.back());
  await waitFor(() => expect(screen.getByRole("heading", { name: "GitHub Flow" })).toBeTruthy());
  const url = page.router.state.location.href;
  page.unmount();

  const reloaded = await renderPage(url);
  expect(await screen.findByRole("heading", { name: "GitHub Flow" })).toBeTruthy();
  await act(async () => reloaded.router.navigate({ to: "/naming", search: {} }));
  expect(screen.getByRole("heading", { name: "Naming" })).toBeTruthy();
  expect(reloaded.router.state.location.search).toEqual({ settings: settingsUrl });
  await act(async () => reloaded.router.history.back());
  await waitFor(() => expect(screen.getByRole("heading", { name: "GitHub Flow" })).toBeTruthy());
  expect(reloaded.router.state.location.search.settings).toBe(settingsUrl);
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it("restores legacy source links and gives global settings precedence", async () => {
  const page = await renderPage(`/branches?source=${encodeURIComponent(legacyUrl)}`);
  expect(await screen.findByRole("heading", { name: "Legacy workflow" })).toBeTruthy();
  await act(async () =>
    page.router.navigate({
      to: "/branches",
      search: { source: legacyUrl, settings: settingsUrl, flow: undefined },
    }),
  );
  expect(screen.getByRole("heading", { name: "Explore a branching strategy" })).toBeTruthy();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Git Flow" })));
  expect(await screen.findByRole("heading", { name: "Git Flow" })).toBeTruthy();
  expect(page.router.state.location.search).toEqual({ settings: settingsUrl, flow: "git-flow" });
  await act(async () =>
    page.router.navigate({
      to: "/branches",
      search: { source: legacyUrl, settings: customUrl, flow: "github-flow" },
    }),
  );
  expect(await screen.findByRole("heading", { name: "Team workflow" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Change strategy" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Legacy workflow" })).toBeNull();
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
