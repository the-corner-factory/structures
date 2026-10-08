// @vitest-environment jsdom

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";

import { useSiteSettings } from "#/components/site-settings-provider.tsx";
import { AGENTIC_TEMPLATES, validateAgenticSearch } from "#/lib/agentic.ts";
import { Route } from "#/routes/agentic.tsx";

vi.mock("#/components/site-settings-provider.tsx", () => ({ useSiteSettings: vi.fn() }));

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.mocked(useSiteSettings).mockReturnValue({ isPending: false, error: null, refetch: vi.fn() });
});

it("uses one resolved template for custom map labels, cards, references, previews, and downloads", async () => {
  const readme = "# Team runtime\n\nRun the project checks before handing off.";
  vi.mocked(useSiteSettings).mockReturnValue({
    url: "https://example.com/settings.json",
    settings: {
      version: 1,
      agentic: {
        harness: {
          name: "Team runtime",
          description: "Executes our team workflow.",
          distinction: "The runtime enforces our project permissions.",
          source: "https://example.com/runtime",
          sourceLabel: "Team runtime reference",
          readme,
        },
        instructions: { name: "Working guidance" },
        "agents-md": { name: "TEAM.md", readme: "# Team guidance" },
      },
    },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  });
  const { container, router } = await renderPage();
  const map = screen.getByRole("group", { name: "Agent system building blocks" });
  expect(within(map).getByRole("button", { name: "Team runtime", pressed: true })).toBeTruthy();
  expect(within(map).getByText("Executes our team workflow.")).toBeTruthy();
  expect(screen.getByRole("list", { name: "Team runtime connections" }).textContent).toContain(
    "Team runtime runs Agent",
  );
  expect(container.querySelectorAll('.agentic-map-connection[data-active="true"]')).toHaveLength(5);
  const reference = screen.getByRole("link", { name: "Team runtime reference" });
  expect(reference.getAttribute("href")).toBe("https://example.com/runtime");
  const download = screen.getByRole("link", { name: "Download Team runtime template" });
  expect(decodeURIComponent(download.getAttribute("href")!)).toBe(
    `data:text/markdown;charset=utf-8,${readme}`,
  );
  const preview = screen.getByRole("region", { name: "Team runtime / README.md" });
  expect(within(preview).getByRole("heading", { name: "Team runtime", level: 1 })).toBeTruthy();

  await click(screen.getByRole("radio", { name: "Cards & templates" }));
  expect(screen.getByRole("button", { name: "Team runtime", pressed: true })).toBeTruthy();
  await click(screen.getByRole("button", { name: "TEAM.md" }));
  expect(router.state.location.search.template).toBe("agents-md");
  expect(screen.getByRole("region", { name: "Working guidance / TEAM.md" })).toBeTruthy();
  expect(
    screen
      .getByRole("button", { name: "Working guidance" })
      .closest(".agentic-card")
      ?.getAttribute("data-selected"),
  ).toBe("true");
  await click(screen.getByRole("radio", { name: "System map" }));
  expect(screen.getByRole("button", { name: "Working guidance", pressed: true })).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Download TEAM.md template" }).getAttribute("download"),
  ).toBe("TEAM.md");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function renderPage(url = "/agentic") {
  const root = createRootRoute();
  const route = createRoute({
    getParentRoute: () => root,
    path: "/agentic",
    validateSearch: Route.options.validateSearch,
    component: Route.options.component,
  });
  const router = createRouter({
    routeTree: root.addChildren([route]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  await router.load();
  return { ...render(<RouterProvider router={router} />), router };
}

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

it.each(AGENTIC_TEMPLATES)("restores $id from a direct link in either view", async (template) => {
  for (const view of ["map", "cards"]) {
    const page = await renderPage(`/agentic?view=${view}&template=${template.id}`);
    expect(
      screen.getByRole("radio", {
        name: view === "map" ? "System map" : "Cards & templates",
        checked: true,
      }),
    ).toBeTruthy();
    const download = screen.getByRole("link", { name: `Download ${template.name} template` });
    if (template.name.endsWith(".md")) {
      expect(download.getAttribute("download")).toBe(template.name);
    }
    expect(decodeURIComponent(download.getAttribute("href")!)).toContain(template.readme);
    page.unmount();
  }
});

it("keeps view and template in the URL through selection, history, and reload", async () => {
  const page = await renderPage("/agentic#agentic-readme");
  vi.mocked(window.scrollTo).mockClear();
  await click(screen.getByRole("button", { name: "Prompt" }));
  expect(page.router.state.location.search).toEqual({ template: "prompt" });
  await click(screen.getByRole("radio", { name: "Cards & templates" }));
  expect(page.router.state.location.search).toEqual({ view: "cards", template: "prompt" });
  await click(screen.getByRole("button", { name: "Skills" }));
  expect(page.router.state.location.search).toEqual({ view: "cards", template: "skills" });
  expect(page.router.state.location.hash).toBe("agentic-readme");
  expect(window.scrollTo).not.toHaveBeenCalled();

  await act(async () => page.router.history.back());
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Prompt", pressed: true })).toBeTruthy(),
  );
  await act(async () => page.router.history.back());
  await waitFor(() =>
    expect(screen.getByRole("radio", { name: "System map", checked: true })).toBeTruthy(),
  );
  expect(screen.getByRole("link", { name: "Download Prompt template" })).toBeTruthy();
  await act(async () => page.router.history.forward());
  await waitFor(() =>
    expect(screen.getByRole("radio", { name: "Cards & templates", checked: true })).toBeTruthy(),
  );

  const url = page.router.state.location.href;
  page.unmount();
  const reloaded = await renderPage(url);
  expect(screen.getByRole("radio", { name: "Cards & templates", checked: true })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Prompt", pressed: true })).toBeTruthy();
  await click(screen.getByRole("button", { name: "Harness" }));
  expect(reloaded.router.state.location.search).toEqual({ view: "cards" });
  await click(screen.getByRole("radio", { name: "System map" }));
  expect(reloaded.router.state.location.href).toBe("/agentic#agentic-readme");
});

it.each([
  {},
  { view: "unknown", template: "missing" },
  { view: ["cards"], template: { id: "skills" } },
  { view: 1, template: true },
])("ignores invalid configuration: %j", (search) => {
  expect(validateAgenticSearch(search)).toEqual({ view: undefined, template: undefined });
});

it("falls back to the system map and Harness for invalid query parameters", async () => {
  await renderPage("/agentic?view=unknown&template=missing");
  expect(screen.getByRole("radio", { name: "System map", checked: true })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Harness", pressed: true })).toBeTruthy();
});

it("highlights the elements each card can include without changing the selected template", async () => {
  const { container } = await renderPage();
  await click(screen.getByRole("radio", { name: "Cards & templates" }));
  const highlighted = () =>
    Array.from(container.querySelectorAll('[data-embedded="true"] .agentic-card-select'))
      .map((button) => button.getAttribute("aria-label") ?? "")
      .sort();
  const conditional = () =>
    Array.from(container.querySelectorAll('[data-conditional="true"] .agentic-card-select'))
      .map((button) => button.getAttribute("aria-label") ?? "")
      .sort();
  const relationships: Array<[string, string[], string[]]> = [
    [
      "Harness",
      ["Plugins", "Agents", "MCP Servers", "Skills", "Instructions", "Hooks", "Tools"],
      [],
    ],
    ["Plugins", ["Agents", "MCP Servers", "Skills", "Instructions", "Hooks", "Tools"], []],
    ["Agents", ["MCP Servers", "Skills", "Instructions", "Hooks", "Tools"], ["Hooks"]],
    ["MCP Servers", ["Skills", "Instructions", "Tools"], ["Skills"]],
    ["Skills", ["Instructions", "Hooks", "Tools"], ["Hooks", "Tools"]],
    ["Instructions", [], []],
    ["Hooks", ["Instructions"], ["Instructions"]],
    ["Tools", ["Instructions"], []],
  ];

  expect(highlighted()).toEqual([]);
  for (const [name, children, extensions] of relationships) {
    const button = screen.getByRole("button", { name });
    fireEvent.pointerEnter(button);
    expect(highlighted()).toEqual([...children].sort());
    expect(conditional()).toEqual([...extensions].sort());
    expect(screen.getByRole("status").textContent).toContain(`${name}:`);
    expect(screen.getByRole("button", { name: "Harness", pressed: true })).toBeTruthy();
    fireEvent.pointerLeave(button);
    expect(highlighted()).toEqual([]);
    expect(conditional()).toEqual([]);
    expect(screen.getByRole("status").textContent).toContain("Hover or focus a card");
    fireEvent.focus(button);
    expect(highlighted()).toEqual([...children].sort());
    expect(conditional()).toEqual([...extensions].sort());
    fireEvent.blur(button);
    expect(highlighted()).toEqual([]);
    expect(conditional()).toEqual([]);
  }

  const agents = screen.getByRole("button", { name: "Agents" });
  const prompt = screen.getByRole("button", { name: "Prompt" });
  fireEvent.focus(agents);
  expect(highlighted()).toEqual(["MCP Servers", "Skills", "Instructions", "Hooks", "Tools"].sort());
  fireEvent.blur(agents, { relatedTarget: prompt });
  fireEvent.focus(prompt);
  expect(highlighted()).toEqual(["MCP Servers", "Skills", "Instructions", "Hooks", "Tools"].sort());
  fireEvent.pointerEnter(screen.getByRole("button", { name: "Tools" }));
  expect(highlighted()).toEqual(["Instructions"]);
  fireEvent.pointerLeave(screen.getByRole("button", { name: "Tools" }));
  expect(highlighted()).toEqual(["MCP Servers", "Skills", "Instructions", "Hooks", "Tools"].sort());
  fireEvent.blur(prompt);
  expect(highlighted()).toEqual([]);
});

it("selects each building block and updates its README and Markdown download", async () => {
  await renderPage();
  await click(screen.getByRole("radio", { name: "Cards & templates" }));
  expect(screen.getByRole("heading", { level: 1, name: "Agentic" })).toBeTruthy();

  const examples = [
    ["Harness", "Project workspace harness", "harness-README.md"],
    ["Agents", "Code review agent", "agents-README.md"],
    ["Prompt", "Prompt", "prompt-README.md"],
    ["Artifacts", "Artifacts", "artifacts-README.md"],
    ["Plugins", "Team development plugin", "plugins-README.md"],
    ["MCP Servers", "Project knowledge MCP server", "mcp-servers-README.md"],
    ["Skills", "Review changes skill", "skills-README.md"],
    ["Instructions", "Team working instructions", "instructions-README.md"],
    ["Hooks", "Post-edit validation hook", "hooks-README.md"],
    ["Tools", "Search project docs tool", "tools-README.md"],
    ["AGENTS.md", "AGENTS.md", "AGENTS.md"],
    ["GLOSSARY.md", "GLOSSARY.md", "GLOSSARY.md"],
    ["DESIGN.md", "DESIGN.md", "DESIGN.md"],
    ["PRODUCT.md", "PRODUCT.md", "PRODUCT.md"],
  ] as const;

  expect(screen.getByRole("button", { name: "Harness", pressed: true })).toBeTruthy();
  for (const [name, heading, filename] of examples) {
    const card = screen.getByRole("button", { name });
    await click(card);

    expect(screen.getAllByRole("button", { pressed: true })).toEqual([card]);
    const readme = screen.getByRole("region", {
      name:
        name === "Prompt" || name === "Artifacts"
          ? `Agents / ${name}`
          : name.endsWith(".md")
            ? `Instructions / ${name}`
            : `${name} / README.md`,
    });
    expect(card.getAttribute("aria-controls")).toBe(readme.id);
    expect(within(readme).getByRole("heading", { level: 1, name: heading })).toBeTruthy();
    expect(within(readme).getAllByRole("article")).toHaveLength(1);
    expect(within(readme).getByRole("heading", { name: `How ${name} fits in` })).toBeTruthy();
    const download = within(readme).getByRole("link", { name: `Download ${name} template` });
    expect(download.getAttribute("download")).toBe(filename);
    expect(decodeURIComponent(download.getAttribute("href")!)).toContain(`,# ${heading}\n`);
  }
});

it("selects the Prompt badge inside Agents and can return to the agent template", async () => {
  await renderPage();
  await click(screen.getByRole("radio", { name: "Cards & templates" }));
  const agents = screen.getByRole("button", { name: "Agents" });
  const card = agents.closest<HTMLElement>(".agentic-card")!;
  const prompt = within(card).getByRole("button", {
    name: "Prompt",
    description: "The request you give an agent.",
  });
  await click(prompt);

  expect(screen.getAllByRole("button", { pressed: true })).toEqual([prompt]);
  expect(card.getAttribute("data-selected")).toBe("true");
  const readme = screen.getByRole("region", { name: "Agents / Prompt" });
  expect(
    within(readme).getByRole("heading", { name: "Prompt, instructions, and context" }),
  ).toBeTruthy();
  expect(within(readme).getByRole("heading", { name: "Example prompt" })).toBeTruthy();

  await click(agents);
  expect(screen.getAllByRole("button", { pressed: true })).toEqual([agents]);
  expect(screen.getByRole("region", { name: "Agents / README.md" })).toBeTruthy();
});

it("groups instruction files as badges and can return to the Instructions description", async () => {
  const { container } = await renderPage();
  await click(screen.getByRole("radio", { name: "Cards & templates" }));
  const instructions = screen.getByRole("button", { name: "Instructions" });
  const card = instructions.closest(".agentic-card")!;
  const files = within(card as HTMLElement).getByRole("group", { name: "Instruction files" });

  expect(container.querySelectorAll(".agentic-card")).toHaveLength(8);
  expect(container.querySelector("button button")).toBeNull();
  for (const name of ["AGENTS.md", "GLOSSARY.md", "DESIGN.md", "PRODUCT.md"]) {
    const badge = within(files).getByRole("button", { name });
    await click(badge);

    expect(screen.getAllByRole("button", { pressed: true })).toEqual([badge]);
    expect(card.getAttribute("data-selected")).toBe("true");
    expect(screen.getByRole("region", { name: `Instructions / ${name}` })).toBeTruthy();
  }

  await click(instructions);
  expect(screen.getAllByRole("button", { pressed: true })).toEqual([instructions]);
  expect(screen.getByRole("region", { name: "Instructions / README.md" })).toBeTruthy();
});

it("traces the sketch's directed connections and opens their existing templates", async () => {
  const { container } = await renderPage();
  expect(screen.getByRole("radio", { name: "System map", checked: true })).toBeTruthy();
  const map = screen.getByRole("group", { name: "Agent system building blocks" });
  expect(within(map).getAllByRole("button")).toHaveLength(15);
  expect(screen.getByRole("list", { name: "Harness connections" }).textContent).toContain(
    "Harness executes authorized calls to Tools",
  );

  const examples = [
    ["Plugins", "Plugins supply components to Harness", "Plugins / README.md", 1],
    ["Harness", "Harness runs Agent", "Harness / README.md", 5],
    ["MCP servers", "MCP servers expose Tools", "MCP Servers / README.md", 2],
    ["Hooks", "Harness triggers Hooks", "Hooks / README.md", 1],
    ["Agent", "Agent requests calls to Tools", "Agents / README.md", 5],
    ["Tools", "Harness executes authorized calls to Tools", "Tools / README.md", 3],
    ["Instructions", "Instructions orient Agent", "Instructions / README.md", 1],
    ["Skills", "Skills guide Agent", "Skills / README.md", 1],
    ["Specs & context", "Specs & context inform Agent when read", "Instructions / GLOSSARY.md", 1],
  ] as const;

  for (const [name, relationship, template, count] of examples) {
    await click(within(map).getByRole("button", { name }));
    expect(within(map).getByRole("button", { name, pressed: true })).toBeTruthy();
    const list = screen.getByRole("list", { name: `${name} connections` });
    expect(list.textContent).toContain(relationship);
    expect(within(list).getAllByRole("listitem")).toHaveLength(count);
    expect(container.querySelectorAll('.agentic-map-connection[data-active="true"]')).toHaveLength(
      count,
    );
    expect(screen.getByRole("region", { name: template })).toBeTruthy();
  }
  expect(screen.getByRole("link", { name: "Download GLOSSARY.md template" })).toBeTruthy();
});

it("defaults to the system map and preserves templates when switching views", async () => {
  await renderPage();
  expect(screen.getByRole("radio", { name: "System map", checked: true })).toBeTruthy();
  expect(screen.getByRole("radio", { name: "Cards & templates", checked: false })).toBeTruthy();

  for (const [name, parent] of [
    ["Prompt", "Agent"],
    ["Artifacts", "Agent"],
    ["AGENTS.md", "Instructions"],
    ["GLOSSARY.md", "Specs & context"],
    ["DESIGN.md", "Specs & context"],
    ["PRODUCT.md", "Specs & context"],
  ]) {
    await click(screen.getByRole("button", { name }));
    await click(screen.getByRole("radio", { name: "Cards & templates" }));
    expect(screen.queryByRole("group", { name: "Agent system building blocks" })).toBeNull();
    expect(screen.getByRole("button", { name, pressed: true })).toBeTruthy();
    expect(screen.getByRole("link", { name: `Download ${name} template` })).toBeTruthy();

    await click(screen.getByRole("radio", { name: "System map" }));
    const map = screen.getByRole("group", { name: "Agent system building blocks" });
    expect(within(map).getByRole("button", { name: parent, pressed: true })).toBeTruthy();
    expect(within(map).getByRole("button", { name, pressed: true })).toBeTruthy();
    expect(screen.getByRole("link", { name: `Download ${name} template` })).toBeTruthy();
  }
});

it("opens agent examples and Markdown files directly from their graph blocks", async () => {
  const { container } = await renderPage();
  const map = screen.getByRole("group", { name: "Agent system building blocks" });
  expect(container.querySelector("button button")).toBeNull();

  for (const [name, parent, region] of [
    ["Prompt", "Agent", "Agents / Prompt"],
    ["Artifacts", "Agent", "Agents / Artifacts"],
    ["AGENTS.md", "Instructions", "Instructions / AGENTS.md"],
    ["GLOSSARY.md", "Specs & context", "Instructions / GLOSSARY.md"],
    ["DESIGN.md", "Specs & context", "Instructions / DESIGN.md"],
    ["PRODUCT.md", "Specs & context", "Instructions / PRODUCT.md"],
  ]) {
    const block = within(map)
      .getByRole("button", { name: parent })
      .closest<HTMLElement>(".agentic-map-node")!;
    const badge = within(block).getByRole("button", { name });
    await click(badge);

    expect(badge.getAttribute("aria-pressed")).toBe("true");
    expect(block.getAttribute("data-selected")).toBe("true");
    const readme = screen.getByRole("region", { name: region });
    expect(badge.getAttribute("aria-controls")).toBe(readme.id);
    expect(within(readme).getByRole("heading", { level: 1, name })).toBeTruthy();
    expect(within(readme).getByRole("link", { name: `Download ${name} template` })).toBeTruthy();
    if (parent === "Specs & context") {
      expect(
        screen.getByRole("list", { name: "Specs & context connections" }).textContent,
      ).toContain("Specs & context inform Agent when read");
      expect(screen.getByRole("link", { name: `Read ${name} example` })).toBeTruthy();
    }

    await click(within(block).getByRole("button", { name: parent }));
    expect(screen.getByRole("list", { name: `${parent} connections` })).toBeTruthy();
    if (name !== "GLOSSARY.md") expect(badge.getAttribute("aria-pressed")).toBe("false");
  }
});
