// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  retainSearchParams,
  RouterProvider,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";

import { validateAgenticSearch } from "#/lib/agentic.ts";
import { validateExplorerSearch, validateSiteSearch } from "#/lib/router-search.ts";
import { parseSiteSettings } from "#/lib/site-settings.ts";

import example from "../../public/settings.example.json";
import { AgenticPage } from "./agentic-page";
import { AppShell } from "./app-shell";
import { BranchFlowPage } from "./branch-flow-page";
import { HomeTopics } from "./home-topics";
import { IssueCards } from "./issue-cards";
import { NamingStandard } from "./naming-standard";
import { SiteSettingsProvider } from "./site-settings-provider";
import { StructureBoard } from "./structure-board";
import { StructureExplorer } from "./structure-explorer";

vi.mock("./branch-graph", () => ({
  BranchGraph: ({ flow }: { flow: { libraryName: string } }) => (
    <div>{flow.libraryName} diagram</div>
  ),
}));

const url = "https://example.com/settings.json";
const profile = parseSiteSettings(example);
const clients: QueryClient[] = [];
const builtin = { libraryName: "user", structures: [{ name: "Default folder", type: "folder" }] };

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) =>
      input === url ? Response.json(profile) : Response.json(builtin),
    ),
  );
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function renderSite(initial = "/") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  clients.push(client);
  const root = createRootRoute({
    validateSearch: validateSiteSearch,
    search: { middlewares: [retainSearchParams(["settings"])] },
    component: () => (
      <SiteSettingsProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </SiteSettingsProvider>
    ),
  });
  const routes = [
    createRoute({ getParentRoute: () => root, path: "/", component: HomeTopics }),
    createRoute({
      getParentRoute: () => root,
      path: "/issues",
      validateSearch: validateExplorerSearch,
      component: IssueCards,
    }),
    createRoute({
      getParentRoute: () => root,
      path: "/status",
      component: () => <StructureBoard variant="kanban" />,
    }),
    createRoute({ getParentRoute: () => root, path: "/naming", component: NamingStandard }),
    createRoute({
      getParentRoute: () => root,
      path: "/agentic",
      validateSearch: validateAgenticSearch,
      component: AgenticPage,
    }),
    createRoute({ getParentRoute: () => root, path: "/branches", component: BranchFlowPage }),
    ...["/folders", "/folders/$library", "/folders/$library/$element"].map((path) =>
      createRoute({
        getParentRoute: () => root,
        path,
        validateSearch: validateExplorerSearch,
        component: () => {
          const { library, element } = useParams({ strict: false });
          const { source } = useSearch({ strict: false });
          return (
            <StructureExplorer
              kind="folders"
              library={library}
              element={element}
              sourceOverride={source}
            />
          );
        },
      }),
    ),
  ];
  const router = createRouter({
    routeTree: root.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [initial] }),
    Wrap: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  await router.load();
  return { ...render(<RouterProvider router={router} />), router };
}

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

async function loadSettings(value = url) {
  fireEvent.change(screen.getByRole("textbox", { name: "Website settings URL" }), {
    target: { value },
  });
  await click(screen.getByRole("button", { name: "Load" }));
}

async function topic(name: string) {
  await click(
    within(screen.getByRole("navigation", { name: "Primary navigation" })).getByRole("link", {
      name,
    }),
  );
}

it("keeps a single-logo profile working across navigation and reset", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({
      ...profile,
      logo: { url: "https://assets.up4it.io/logos/up4it_logo.svg", alt: "up4it" },
    }),
  );
  const page = await renderSite();
  expect(screen.getByRole("img", { name: "The Corner" }).getAttribute("src")).toBe(
    "/the_corner-logo.webp",
  );
  await loadSettings();
  const logo = await screen.findByRole("img", { name: "up4it" });
  expect(logo.getAttribute("src")).toBe("https://assets.up4it.io/logos/up4it_logo.svg");
  expect(logo.classList.contains("default-brand-logo")).toBe(false);
  await topic("Naming");
  expect(screen.getByRole("img", { name: "up4it" }).getAttribute("src")).toBe(
    "https://assets.up4it.io/logos/up4it_logo.svg",
  );
  await click(screen.getByRole("button", { name: "Reset" }));
  expect((await screen.findByRole("img", { name: "The Corner" })).getAttribute("src")).toBe(
    "/the_corner-logo.webp",
  );
  await act(async () => page.router.history.back());
  await screen.findByRole("img", { name: "up4it" });
});

it("loads both theme logos, preserves them across navigation, and clears them on reset", async () => {
  await renderSite();
  await loadSettings();
  const logos = await screen.findAllByRole("img", { name: "up4it" });
  expect(logos.map((logo) => logo.getAttribute("src"))).toEqual([
    "https://assets.up4it.io/logos/up4it_logo.webp",
    "https://assets.up4it.io/logos/up4it_logo-white.webp",
  ]);
  await topic("Naming");
  expect(screen.getAllByRole("img", { name: "up4it" })).toEqual(logos);
  await click(screen.getByRole("button", { name: "Reset" }));
  await screen.findByRole("img", { name: "The Corner" });
  expect(screen.queryAllByRole("img", { name: "up4it" })).toHaveLength(0);
});

it("applies one cached profile through all six sections, home links, and nested documentation", async () => {
  const page = await renderSite();
  await loadSettings();
  await screen.findByRole("button", { name: /^Load$/ });
  await click(screen.getByRole("link", { name: /Folders Explore opinionated/ }));
  await screen.findByRole("treeitem", { name: "README.md" });
  await click(screen.getByRole("treeitem", { name: "README.md" }));
  await screen.findByRole("heading", { name: "Project guide" });
  expect(page.router.state.location.search.settings).toBe(url);
  await topic("Issues");
  await screen.findByText("fix: restore checkout");
  expect(screen.queryByText("fix(auth): refresh session before token expires")).toBeNull();
  await topic("Status");
  await screen.findByRole("button", { name: "Ready" });
  await topic("Naming");
  await screen.findByRole("heading", { name: "Team naming" });
  await topic("Branches");
  await screen.findByText("Team branches diagram");
  await topic("Agentic");
  await screen.findByRole("button", { name: "Team harness", pressed: true });
  await click(screen.getByRole("radio", { name: "Cards & templates" }));
  expect(page.router.state.location.search).toEqual({ settings: url, view: "cards" });
  await click(screen.getByRole("link", { name: "Structures home" }));
  expect(page.router.state.location.search.settings).toBe(url);
  expect(vi.mocked(fetch).mock.calls.filter(([input]) => input === url)).toHaveLength(1);
  expect(vi.mocked(fetch).mock.calls).toHaveLength(1);
});

it("loads and resets on the same topic, retains filters, clears old selections, and restores history", async () => {
  const page = await renderSite(
    "/folders/user/Default%20folder?q=component&source=https%3A%2F%2Fold.example%2Fsettings.json",
  );
  await screen.findByRole("searchbox");
  await loadSettings();
  await screen.findByRole("treeitem", { name: "components" });
  expect(page.router.state.location.pathname).toBe("/folders");
  expect(page.router.state.location.search).toEqual({ settings: url, q: "component" });
  await click(screen.getByRole("treeitem", { name: "components" }));
  await screen.findByRole("heading", { name: "Team components" });
  await click(screen.getByRole("button", { name: "Reset" }));
  await waitFor(() => expect(page.router.state.location.search.settings).toBeUndefined());
  expect(page.router.state.location.pathname).toBe("/folders");
  expect(page.router.state.location.search.q).toBe("component");
  expect(page.router.state.location.search.source).toBeUndefined();
  await act(async () => page.router.history.back());
  await screen.findByRole("heading", { name: "Team components" });
  expect(
    screen.getByRole<HTMLInputElement>("textbox", { name: "Website settings URL" }).value,
  ).toBe(url);
  const href = page.router.state.location.href;
  page.unmount();
  await renderSite(href);
  await screen.findByRole("heading", { name: "Team components" });
  expect(screen.getByRole<HTMLInputElement>("searchbox").value).toBe("component");
});

it("keeps Agentic selections and hash when loading/resetting a profile", async () => {
  const page = await renderSite("/agentic?view=cards&template=agents-md#agentic-readme");
  await loadSettings();
  await screen.findByRole("button", { name: /^Load$/ });
  expect(page.router.state.location.search).toEqual({
    settings: url,
    view: "cards",
    template: "agents-md",
  });
  expect(page.router.state.location.hash).toBe("agentic-readme");
  await click(screen.getByRole("button", { name: "Reset" }));
  expect(page.router.state.location.search).toEqual({ view: "cards", template: "agents-md" });
  expect(page.router.state.location.hash).toBe("agentic-readme");
});

it("shows failure without partial defaults and allows retry or reset", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
  await renderSite(`/naming?settings=${encodeURIComponent(url)}`);
  await screen.findByRole("heading", { name: "Could not load website settings" });
  expect(screen.queryByRole("heading", { name: "Conventional commits" })).toBeNull();
  await click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("heading", { name: "Team naming" });
  await click(screen.getByRole("button", { name: "Reset" }));
  await screen.findByRole("heading", { name: "Conventional commits" });
});

it("aborts an obsolete request and never applies its late result", async () => {
  let finish!: (response: Response) => void;
  let signal: AbortSignal | undefined;
  vi.mocked(fetch).mockImplementationOnce((_input, init) => {
    signal = init?.signal as AbortSignal;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const page = await renderSite(`/naming?settings=${encodeURIComponent(url)}`);
  await screen.findByRole("status");
  await click(screen.getByRole("button", { name: "Reset" }));
  await screen.findByRole("heading", { name: "Conventional commits" });
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    finish(Response.json(profile));
  });
  expect(page.router.state.location.search.settings).toBeUndefined();
  expect(screen.queryByRole("heading", { name: "Team naming" })).toBeNull();
});

it("retries missing inline documentation by refreshing the shared profile", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({
      ...profile,
      folders: {
        ...profile.folders,
        documentation: {},
      },
    }),
  );
  await renderSite(`/folders/team/guide?settings=${encodeURIComponent(url)}`);
  await screen.findByText("Documentation unavailable");
  await click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("heading", { name: "Project guide" });
  expect(vi.mocked(fetch).mock.calls.every(([input]) => input === url)).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("downloads the complete active profile as a loadable settings.json", async () => {
  let downloaded: Blob | undefined;
  const createObjectURL = vi.fn((blob: Blob) => {
    downloaded = blob;
    return "blob:settings";
  });
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = vi.fn();
    },
  );
  const clickAnchor = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  await renderSite(`/folders?settings=${encodeURIComponent(url)}`);
  await screen.findByRole("treeitem", { name: "README.md" });
  await click(screen.getByRole("button", { name: "Open explorer settings" }));
  await click(screen.getByRole("button", { name: "Download website settings" }));
  expect((clickAnchor.mock.instances[0] as HTMLAnchorElement).download).toBe("settings.json");
  const text = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(downloaded!);
  });
  expect(parseSiteSettings(JSON.parse(text))).toEqual(profile);
});

it("uses built-ins for omitted sections and ignores legacy source while a global profile is active", async () => {
  vi.mocked(fetch).mockImplementation(async (input) =>
    input === url ? Response.json({ version: 1 }) : Response.json(builtin),
  );
  await renderSite(
    `/folders?settings=${encodeURIComponent(url)}&source=https%3A%2F%2Fold.example%2Fsettings.json`,
  );
  await screen.findByRole("treeitem", { name: "Default folder" });
  expect(
    vi
      .mocked(fetch)
      .mock.calls.some(([input]) => typeof input === "string" && input.includes("old.example")),
  ).toBe(false);
  await topic("Naming");
  await screen.findByRole("heading", { name: "Conventional commits" });
});

it.each([undefined, null, false, 42, [], "javascript:alert(1)", "not a URL"])(
  "ignores invalid global search state: %j",
  (settings) => {
    expect(validateSiteSearch({ settings })).toEqual({});
  },
);
