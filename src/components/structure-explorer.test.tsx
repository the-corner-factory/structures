// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserHistory,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";

import { validateExplorerSearch } from "#/lib/router-search.ts";
import type { ExplorerKind, FolderSettings } from "#/lib/structures.ts";

import { StructureExplorer } from "./structure-explorer.tsx";

const settings: FolderSettings = {
  libraryName: "test",
  structures: [
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "components",
          type: "folder",
          children: [{ name: "component.tsx", type: "file" }],
        },
        { name: "main.ts", type: "file" },
      ],
    },
    { name: "README.md", type: "file" },
  ],
};
const customSource = "https://example.com/settings.json";
const clients: QueryClient[] = [];

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.endsWith("settings.json")
        ? Response.json(settings)
        : new Response("# Purpose\n\nExample documentation."),
    ),
  );
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

async function renderExplorer(kind: ExplorerKind, url: string, browser = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const root = createRootRoute();
  const component = () => {
    const { library, element } = useParams({ strict: false });
    const { source } = useSearch({ strict: false });
    return (
      <StructureExplorer kind={kind} library={library} element={element} sourceOverride={source} />
    );
  };
  const routes = ["", "/$library", "/$library/$element"].map((suffix) =>
    createRoute({
      getParentRoute: () => root,
      path: `/${kind}${suffix}`,
      validateSearch: validateExplorerSearch,
      component,
    }),
  );
  if (browser) window.history.replaceState(null, "", url);
  const router = createRouter({
    routeTree: root.addChildren(routes),
    history: browser ? createBrowserHistory() : createMemoryHistory({ initialEntries: [url] }),
    scrollRestoration: true,
    Wrap: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  await router.load();
  const page = render(<RouterProvider router={router} />);
  await screen.findByRole("tree", { name: "Structure contents" });
  return { ...page, router };
}

async function changeQuery(value: string) {
  await act(async () => {
    fireEvent.change(screen.getByRole("searchbox", { name: "Search structure" }), {
      target: { value },
    });
  });
}

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

it.each(["folders", "issues"] as const)(
  "restores the %s filter through direct links, item selection, history, and reload",
  async (kind) => {
    const page = await renderExplorer(
      kind,
      `/${kind}/test?source=${encodeURIComponent(customSource)}&q=component`,
    );
    const searchbox = () => screen.getByRole<HTMLInputElement>("searchbox");
    expect(searchbox().value).toBe("component");
    expect(screen.queryByRole("treeitem", { name: "main.ts" })).toBeNull();
    expect(screen.getByRole("treeitem", { name: "src" })).toBeTruthy();

    await click(screen.getByRole("treeitem", { name: "components" }));
    expect(page.router.state.location.pathname).toBe(`/${kind}/test/components`);
    expect(page.router.state.location.search).toEqual({ source: customSource, q: "component" });
    await click(screen.getByRole("treeitem", { name: "component.tsx" }));
    expect(page.router.state.location.pathname).toBe(`/${kind}/test/component.tsx`);
    expect(page.router.state.location.search).toEqual({ source: customSource, q: "component" });

    await changeQuery("main");
    await screen.findByRole("treeitem", { name: "main.ts" });
    await act(async () => page.router.history.back());
    await waitFor(() => expect(searchbox().value).toBe("component"));
    expect(page.router.state.location.pathname).toBe(`/${kind}/test/components`);
    await act(async () => page.router.history.forward());
    await waitFor(() => expect(searchbox().value).toBe("main"));

    const url = page.router.state.location.href;
    page.unmount();
    await renderExplorer(kind, url);
    expect(searchbox().value).toBe("main");
    expect(screen.getByRole("treeitem", { name: "main.ts" })).toBeTruthy();
    expect(screen.queryByRole("treeitem", { name: "components" })).toBeNull();
  },
);

it.each(["folders", "issues"] as const)(
  "replaces history while typing in %s, preserves source and anchor, and omits an empty filter",
  async (kind) => {
    const page = await renderExplorer(
      kind,
      `/${kind}/test?source=${encodeURIComponent(customSource)}#purpose`,
    );
    vi.mocked(window.scrollTo).mockClear();
    const historyLength = page.router.history.length;
    const replace = vi.spyOn(page.router.history, "replace");

    await changeQuery("comp");
    await changeQuery("component");
    expect(page.router.state.location.search).toEqual({ source: customSource, q: "component" });
    expect(replace).toHaveBeenCalledTimes(2);
    expect(page.router.history.length).toBe(historyLength);
    expect(page.router.state.location.hash).toBe("purpose");
    expect(window.scrollTo).not.toHaveBeenCalled();

    await changeQuery("missing");
    expect(screen.getByText("No items match “missing”.")).toBeTruthy();
    await changeQuery("");
    expect(page.router.state.location.search).toEqual({ source: customSource });
    expect(page.router.state.location.href).not.toContain("q=");
    expect(screen.getByRole("treeitem", { name: "README.md" })).toBeTruthy();
    expect(page.router.state.location.hash).toBe("purpose");
    expect(window.scrollTo).not.toHaveBeenCalled();
  },
);

it("keeps the folder filter when choosing a library", async () => {
  const page = await renderExplorer("folders", "/folders?q=component");
  await click(screen.getByRole("button", { name: "Angular" }));
  expect(page.router.state.location.pathname).toBe("/folders/angular");
  expect(page.router.state.location.search).toEqual({ q: "component" });
});

it("keeps section downloads without a separate source input", async () => {
  await renderExplorer("folders", "/folders/test?q=component");
  await click(screen.getByRole("button", { name: "Open explorer settings" }));
  expect(screen.getByRole("button", { name: "Download structure settings" })).toBeTruthy();
  expect(screen.queryByRole("textbox", { name: "Structure settings URL" })).toBeNull();
  expect(screen.getByRole<HTMLInputElement>("searchbox").value).toBe("component");
});

it("copies a share link that restores the filtered explorer", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  const page = await renderExplorer("folders", "/folders/test", true);
  await changeQuery("component");
  await click(screen.getByRole("button", { name: "Copy a shareable link to this structure" }));
  expect(writeText).toHaveBeenCalledWith(window.location.href);
  const sharedUrl = new URL(writeText.mock.calls[0][0] as string);
  expect(sharedUrl.searchParams.get("q")).toBe("component");

  page.unmount();
  page.router.history.destroy();
  await renderExplorer("folders", `${sharedUrl.pathname}${sharedUrl.search}`);
  expect(screen.getByRole<HTMLInputElement>("searchbox").value).toBe("component");
  expect(screen.queryByRole("treeitem", { name: "main.ts" })).toBeNull();
});

it.each([undefined, null, "", 42, false, ["component"], { q: "component" }])(
  "ignores an invalid filter without losing a valid source: %j",
  (q) => {
    expect(validateExplorerSearch({ source: customSource, q })).toEqual({ source: customSource });
    expect(validateExplorerSearch({ source: false, q: "component" })).toEqual({ q: "component" });
  },
);

it("shows the unfiltered tree for an invalid filter in a direct link", async () => {
  await renderExplorer("folders", '/folders/test?q=["component"]');
  expect(screen.getByRole<HTMLInputElement>("searchbox").value).toBe("");
  expect(screen.getByRole("treeitem", { name: "README.md" })).toBeTruthy();
});
