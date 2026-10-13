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
  await click(screen.getByRole("button", { name: "Plugin skills" }));
  expect(page.router.state.location.search).toEqual({ template: "plugin-skills" });
  await click(screen.getByRole("radio", { name: "Cards & templates" }));
  expect(page.router.state.location.search).toEqual({ view: "cards", template: "plugin-skills" });
  await click(screen.getByRole("button", { name: "Project skills" }));
  expect(page.router.state.location.search).toEqual({ view: "cards", template: "skills" });
  expect(page.router.state.location.hash).toBe("agentic-readme");
  expect(window.scrollTo).not.toHaveBeenCalled();

  await act(async () => page.router.history.back());
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Plugin skills", pressed: true })).toBeTruthy(),
  );
  await act(async () => page.router.history.back());
  await waitFor(() =>
    expect(screen.getByRole("radio", { name: "System map", checked: true })).toBeTruthy(),
  );
  expect(screen.getByRole("link", { name: "Download Plugin skills template" })).toBeTruthy();
  await act(async () => page.router.history.forward());
  await waitFor(() =>
    expect(screen.getByRole("radio", { name: "Cards & templates", checked: true })).toBeTruthy(),
  );

  const url = page.router.state.location.href;
  page.unmount();
  const reloaded = await renderPage(url);
  expect(screen.getByRole("radio", { name: "Cards & templates", checked: true })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Plugin skills", pressed: true })).toBeTruthy();
  await click(screen.getByRole("button", { name: "Harness" }));
  expect(reloaded.router.state.location.search).toEqual({ view: "cards" });
  await click(screen.getByRole("radio", { name: "System map" }));
  expect(reloaded.router.state.location.href).toBe("/agentic#agentic-readme");
});

it.each([
  {},
  { view: "unknown", template: "missing", detailed: "yes" },
  { view: ["cards"], template: { id: "skills" }, detailed: [true] },
  { view: 1, template: true, detailed: 1 },
  { detailed: false },
  { detailed: "false" },
])("ignores invalid configuration: %j", (search) => {
  expect(validateAgenticSearch(search)).toEqual({
    view: undefined,
    template: undefined,
    detailed: undefined,
  });
});

it.each([true, "true"])("accepts detailed mode: %j", (detailed) => {
  expect(validateAgenticSearch({ detailed }).detailed).toBe(true);
});

it("shows only feature dots by default and restores text badges with Detailed", async () => {
  const page = await renderPage("/agentic?template=prompt#agentic-readme");
  const map = screen.getByRole("group", { name: "Agent system building blocks" });
  const badges = map.querySelectorAll(".agentic-scoped-badge, .agentic-file-badge");
  const toggle = screen.getByRole("checkbox", { name: "Detailed", checked: false });
  expect(map.getAttribute("data-detailed")).toBe("false");
  expect(map.querySelector(".agentic-map-files")).toBeNull();
  for (const name of [
    "Prompt",
    "Artifacts",
    "AGENTS.md",
    "GLOSSARY.md",
    "DESIGN.md",
    "PRODUCT.md",
  ]) {
    expect(within(map).queryByRole("button", { name })).toBeNull();
  }
  for (const badge of badges) {
    expect(badge.querySelector(".agentic-map-dot")).toBeTruthy();
    expect(badge.getAttribute("aria-label")).toBeTruthy();
    expect(badge.getAttribute("title")).toBeTruthy();
    expect(badge.querySelector("svg")).toBeNull();
    expect(badge.textContent).toBe("");
  }

  vi.mocked(window.scrollTo).mockClear();
  await click(toggle);
  expect(page.router.state.location.search).toEqual({ template: "prompt", detailed: true });
  expect(page.router.state.location.hash).toBe("agentic-readme");
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(map.querySelector(".agentic-map-dot")).toBeNull();
  expect(map.querySelector(".agentic-scoped-badge svg")).toBeTruthy();
  expect(within(map).getByRole("button", { name: "Prompt" }).textContent).toBe("Prompt");
  expect(within(map).getByRole("button", { name: "AGENTS.md" }).textContent).toBe("AGENTS.md");

  await click(screen.getByRole("radio", { name: "Cards & templates" }));
  await click(screen.getByRole("radio", { name: "System map" }));
  expect(screen.getByRole("checkbox", { name: "Detailed", checked: true })).toBeTruthy();
  const url = page.router.state.location.href;
  page.unmount();
  const reloaded = await renderPage(url);
  await click(screen.getByRole("checkbox", { name: "Detailed", checked: true }));
  expect(reloaded.router.state.location.search).toEqual({ template: "prompt" });

  await act(async () => reloaded.router.history.back());
  await waitFor(() =>
    expect(screen.getByRole("checkbox", { name: "Detailed", checked: true })).toBeTruthy(),
  );
  await act(async () => reloaded.router.history.forward());
  await waitFor(() =>
    expect(screen.getByRole("checkbox", { name: "Detailed", checked: false })).toBeTruthy(),
  );
  expect(screen.queryByRole("button", { name: "AGENTS.md" })).toBeNull();
  await click(screen.getByRole("button", { name: "Plugin skills" }));
  expect(screen.getByRole("region", { name: "Plugin skills / README.md" })).toBeTruthy();
});

it("keeps Detailed available in cards and preserves its setting across views", async () => {
  const page = await renderPage("/agentic?view=cards&template=skills#agentic-readme");
  const grid = page.container.querySelector(".agentic-grid")!;
  const badges = grid.querySelectorAll(".agentic-scoped-badge");
  expect(badges.length).toBeGreaterThan(0);
  expect(grid.getAttribute("data-detailed")).toBe("false");
  for (const badge of badges) {
    expect(badge.querySelector(".agentic-map-dot")).toBeTruthy();
    expect(badge.querySelector("svg")).toBeNull();
    expect(badge.getAttribute("aria-label")).toBeTruthy();
    expect(badge.getAttribute("title")).toBeTruthy();
  }
  vi.mocked(window.scrollTo).mockClear();

  await click(screen.getByRole("checkbox", { name: "Detailed", checked: false }));
  expect(page.router.state.location.search).toEqual({
    view: "cards",
    template: "skills",
    detailed: true,
  });
  expect(page.router.state.location.hash).toBe("agentic-readme");
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(screen.getByRole("checkbox", { name: "Detailed", checked: true })).toBeTruthy();
  expect(grid.getAttribute("data-detailed")).toBe("true");
  for (const badge of badges) {
    expect(badge.querySelector("svg")).toBeTruthy();
    expect(badge.querySelector(".agentic-map-dot")).toBeNull();
  }

  await click(screen.getByRole("radio", { name: "System map" }));
  expect(screen.getByRole("checkbox", { name: "Detailed", checked: true })).toBeTruthy();
  expect(
    screen
      .getByRole("group", { name: "Agent system building blocks" })
      .getAttribute("data-detailed"),
  ).toBe("true");

  await click(screen.getByRole("radio", { name: "Cards & templates" }));
  await click(screen.getByRole("checkbox", { name: "Detailed", checked: true }));
  expect(page.router.state.location.search).toEqual({ view: "cards", template: "skills" });
  expect(screen.getByRole("checkbox", { name: "Detailed", checked: false })).toBeTruthy();
  const pluginSkills = screen.getByRole("button", { name: "Plugin skills" });
  expect(pluginSkills.querySelector(".agentic-map-dot")).toBeTruthy();
  expect(pluginSkills.querySelector("svg")).toBeNull();
  await click(pluginSkills);
  expect(page.router.state.location.search).toEqual({ view: "cards", template: "plugin-skills" });
  expect(screen.getByRole("region", { name: "Plugin skills / README.md" })).toBeTruthy();
});

it("keeps project arrows attached to the Agent when its detail level changes", async () => {
  await renderPage();
  const map = screen.getByRole("group", { name: "Agent system building blocks" });
  const paths = () =>
    Array.from(map.querySelectorAll(".agentic-map-connection > path"), (path) =>
      path.getAttribute("d"),
    );

  expect(paths()).toEqual(
    expect.arrayContaining(["M500 496 V368", "M750 496 L602 368", "M250 496 L398 368"]),
  );
  await click(screen.getByRole("checkbox", { name: "Detailed" }));
  expect(paths()).toEqual(
    expect.arrayContaining(["M500 496 V428", "M750 496 L602 428", "M250 496 L398 428"]),
  );
  await click(screen.getByRole("checkbox", { name: "Detailed" }));
  expect(paths()).toEqual(
    expect.arrayContaining(["M500 496 V368", "M750 496 L602 368", "M250 496 L398 368"]),
  );
});

it.each(["/agentic", "/agentic?detailed=true", "/agentic?view=cards"])(
  "orders badge categories alphabetically with conditional badges last in %s",
  async (url) => {
    await renderPage(url);
    for (const names of [
      [
        "Plugin instructions",
        "Plugin skills",
        "Plugin agents",
        "Plugin hooks",
        "Plugin MCP configuration",
      ],
      ["Harness instructions", "Harness skills"],
      ["MCP instructions", "MCP prompts", "MCP resources", "MCP tools", "MCP skills"],
      [
        "Agent instructions",
        "Agent tools",
        "Agent hooks",
        "Agent MCP configuration",
        "Agent skills",
      ],
      ["Skill instructions", "Skill resources", "Skill hooks", "Nested skills"],
      ["Tool instructions"],
      ["Hook instructions"],
    ]) {
      const group = screen
        .getByRole("button", { name: names[0] })
        .closest<HTMLElement>(".agentic-scoped-templates")!;
      const badges = within(group).getAllByRole("button");
      expect(badges.map((badge) => badge.getAttribute("aria-label"))).toEqual(names);
      const firstConditional = badges.findIndex(
        (badge) => badge.getAttribute("data-conditional") === "true",
      );
      if (firstConditional !== -1) {
        expect(
          badges
            .slice(firstConditional)
            .every((badge) => badge.getAttribute("data-conditional") === "true"),
        ).toBe(true);
      }
    }
  },
);

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
      ["Plugins", "Agents", "MCP Servers", "Project skills", "Instructions", "Hooks", "Tools"],
      [],
    ],
    ["Plugins", ["Agents", "MCP Servers", "Instructions", "Hooks", "Tools"], []],
    ["Agents", ["MCP Servers", "Project skills", "Instructions", "Hooks", "Tools"], ["Hooks"]],
    ["MCP Servers", ["Instructions", "Tools", "Project skills"], ["Project skills"]],
    ["Project skills", ["Instructions", "Hooks", "Tools"], ["Hooks", "Tools"]],
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
  expect(highlighted()).toEqual(
    ["MCP Servers", "Project skills", "Instructions", "Hooks", "Tools"].sort(),
  );
  fireEvent.blur(agents, { relatedTarget: prompt });
  fireEvent.focus(prompt);
  expect(highlighted()).toEqual(
    ["MCP Servers", "Project skills", "Instructions", "Hooks", "Tools"].sort(),
  );
  fireEvent.pointerEnter(screen.getByRole("button", { name: "Tools" }));
  expect(highlighted()).toEqual(["Instructions"]);
  fireEvent.pointerLeave(screen.getByRole("button", { name: "Tools" }));
  expect(highlighted()).toEqual(
    ["MCP Servers", "Project skills", "Instructions", "Hooks", "Tools"].sort(),
  );
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
    ["Project skills", "Review changes skill", "skills-README.md"],
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
  expect(within(map).getAllByRole("button")).toHaveLength(32);
  const project = within(map).getByRole("group", { name: "Project" });
  expect(
    within(project).getByRole("button", { name: "Project skills" }).querySelector("strong")
      ?.textContent,
  ).toBe("Skills");
  expect(within(project).getAllByRole("button")).toEqual(
    [
      "Project skills",
      "Skill instructions",
      "Skill resources",
      "Skill hooks",
      "Nested skills",
      "Instructions",
      "Specs & context",
    ].map((name) => within(project).getByRole("button", { name })),
  );
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
    ["Project skills", "Project skills guide Agent", "Project skills / README.md", 1],
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
  await click(screen.getByRole("checkbox", { name: "Detailed" }));

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

it("selects scoped contents, traces their parent connections, and preserves selection across views and history", async () => {
  const { container, router } = await renderPage();
  for (const [name, id, origin, parent, connections] of [
    ["Plugin skills", "plugin-skills", "plugin", "Plugins", 2],
    ["Harness skills", "harness-skills", "harness", "Harness", 1],
    ["Plugin instructions", "plugin-instructions", "plugin", "Plugins", 2],
    ["Harness instructions", "harness-instructions", "harness", "Harness", 1],
    ["Plugin agents", "plugin-agents", "plugin", "Plugins", 2],
    ["Plugin hooks", "plugin-hooks", "plugin", "Plugins", 2],
    ["Plugin MCP configuration", "plugin-mcp-servers", "plugin", "Plugins", 2],
    ["Agent instructions", "agent-instructions", "agent definition", "Agent", 5],
    ["Agent skills", "agent-skills", "agent definition", "Agent", 5],
    ["Agent tools", "agent-tools", "agent definition", "Agent", 5],
    ["Agent MCP configuration", "agent-mcp-servers", "agent definition", "Agent", 5],
    ["Agent hooks", "agent-hooks", "agent definition", "Agent", 5],
    ["Skill instructions", "skill-instructions", "skill", "Project skills", 1],
    ["Skill resources", "skill-resources", "skill", "Project skills", 1],
    ["Skill hooks", "skill-hooks", "skill", "Project skills", 1],
    ["Nested skills", "nested-skills", "skill", "Project skills", 1],
    ["MCP tools", "mcp-tools", "MCP server", "MCP servers", 2],
    ["MCP prompts", "mcp-prompts", "MCP server", "MCP servers", 2],
    ["MCP resources", "mcp-resources", "MCP server", "MCP servers", 2],
    ["MCP instructions", "mcp-instructions", "MCP server", "MCP servers", 2],
    ["MCP skills", "mcp-skills", "MCP server", "MCP servers", 2],
    ["Tool instructions", "tool-instructions", "tool definition", "Tools", 3],
    ["Hook instructions", "hook-instructions", "hook definition", "Hooks", 1],
    ["Project skills", "skills", "project", "Project skills", 1],
  ] as const) {
    const map = screen.getByRole("group", { name: "Agent system building blocks" });
    const block = within(map)
      .getByRole("button", { name: parent })
      .closest<HTMLElement>(".agentic-map-node")!;
    await click(within(block).getByRole("button", { name }));
    expect(router.state.location.search.template).toBe(id);
    expect(block.getAttribute("data-selected")).toBe("true");
    const detail = screen.getByRole("region", { name });
    expect(within(detail).getByText(`Origin: ${origin}`)).toBeTruthy();
    expect(container.querySelectorAll('.agentic-map-connection[data-active="true"]')).toHaveLength(
      connections,
    );
    expect(screen.getByRole("list", { name: `${name} connections` })).toBeTruthy();
    if (id === "plugin-hooks") {
      expect(screen.getByRole("list", { name: `${name} connections` }).textContent).toContain(
        "Harness triggers Hooks",
      );
    }
    if (id === "plugin-mcp-servers") {
      expect(screen.getByRole("list", { name: `${name} connections` }).textContent).toContain(
        "Harness connects to MCP servers",
      );
    }
    if (origin !== "project") {
      expect(within(block).getByRole("button", { name: parent, pressed: false })).toBeTruthy();
      expect(within(block).getByRole("button", { name }).textContent).toBe("");
      expect(within(block).getByRole("button", { name }).getAttribute("title")).toMatch(
        new RegExp(`^${name}(:|$)`),
      );
    }

    await click(screen.getByRole("radio", { name: "Cards & templates" }));
    const selectedTemplate = screen.getByRole("button", { name, pressed: true });
    expect(selectedTemplate).toBeTruthy();
    if (origin !== "project") {
      expect(selectedTemplate.textContent).toBe("");
      expect(selectedTemplate.getAttribute("title")).toMatch(new RegExp(`^${name}(:|$)`));
    }
    const readme = screen.getByRole("region", { name: `${name} / README.md` });
    expect(within(readme).getByText(`Origin: ${origin}`)).toBeTruthy();
    expect(
      within(readme)
        .getByRole("link", { name: `Download ${name} template` })
        .getAttribute("download"),
    ).toBe(`${id}-README.md`);
    await click(screen.getByRole("radio", { name: "System map" }));
    expect(screen.getByRole("button", { name, pressed: true })).toBeTruthy();
  }
  expect(container.querySelector("button button")).toBeNull();
  await click(screen.getByRole("button", { name: "Plugin skills" }));
  await act(async () => router.history.back());
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Project skills", pressed: true })).toBeTruthy(),
  );
  await act(async () => router.history.forward());
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Plugin skills", pressed: true })).toBeTruthy(),
  );
});

it.each([
  ["plugin-skills", "plugin"],
  ["harness-skills", "harness"],
  ["plugin-instructions", "plugin"],
  ["harness-instructions", "harness"],
  ["agent-tools", "agent definition"],
  ["skill-resources", "skill"],
  ["mcp-skills", "MCP server"],
  ["skills", "project"],
])("uses profile overrides consistently for %s without changing its origin", async (id, origin) => {
  const readme = "# Team skill\n\nFollow the team's workflow.";
  vi.mocked(useSiteSettings).mockReturnValue({
    settings: {
      version: 1,
      agentic: {
        [id]: {
          name: "Team skill",
          description: "Our skill workflow.",
          distinction: "Our skill guidance.",
          readme,
          source: "https://example.com/skill",
          sourceLabel: "Team skill reference",
        },
      },
    },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  });
  await renderPage(`/agentic?template=${id}`);
  for (const view of ["System map", "Cards & templates"]) {
    await click(screen.getByRole("radio", { name: view }));
    const button = screen.getByRole("button", { name: "Team skill", pressed: true });
    if (id === "skills") expect(button.textContent).toContain("Team skill");
    else expect(button.getAttribute("title")).toMatch(/^Team skill(:|$)/);
    const readmeRegion = screen.getByRole("region", { name: "Team skill / README.md" });
    expect(within(readmeRegion).getByText(`Origin: ${origin}`)).toBeTruthy();
    expect(readmeRegion.textContent).toContain("Our skill guidance.");
    if (id === "mcp-skills") {
      const support = "Requires the optional MCP Skills extension on the server and client.";
      expect(button.getAttribute("data-conditional")).toBe("true");
      expect(
        screen.getByRole("button", { name: "Team skill", description: `Team skill: ${support}` }),
      ).toBe(button);
      expect(button.getAttribute("title")).toContain(support);
      expect(within(readmeRegion).getByText(support)).toBeTruthy();
    }
    expect(
      within(readmeRegion).getByRole("link", { name: "Team skill reference" }).getAttribute("href"),
    ).toBe("https://example.com/skill");
    expect(
      decodeURIComponent(
        screen.getByRole("link", { name: "Download Team skill template" }).getAttribute("href")!,
      ),
    ).toContain(readme);
  }
});

it("opens agent examples and Markdown files directly from their graph blocks", async () => {
  const { container } = await renderPage("/agentic?detailed=true");
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
