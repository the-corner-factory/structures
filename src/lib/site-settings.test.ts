import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import exampleSettings from "../../public/settings.example.json";
import { fetchSiteSettings, normalizeSettingsUrl, parseSiteSettings } from "./site-settings";

const rawUrl = "https://gist.githubusercontent.com/team/abc123/raw/settings.json";
const issueTree = [
  {
    name: "types",
    type: "folder",
    children: [{ id: "bug-id", name: "Bug", type: "file", color: "red" }],
  },
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
            name: "Urgent",
            type: "file",
            description: "Fix immediately.",
            example: "Production is down.",
          },
        ],
      },
    ],
  },
  {
    name: "Kanban",
    type: "folder",
    children: [{ id: "doing", name: "In progress", type: "file", bgColor: "green" }],
  },
];
const issueExample = {
  number: 42,
  title: "fix: restore service",
  open: true,
  author: "sam",
  openedDaysAgo: 0,
  comments: 2,
  labels: ["bug-id", "urgent"],
  status: "doing",
};
const issueSettings = {
  libraryName: "team",
  structures: issueTree,
  documentation: { "bug-id": "# Bug\nA defect.", urgent: "Fix immediately." },
  examples: [issueExample],
};

describe("site settings validation", () => {
  it("validates the published example with content for every section", () => {
    const settings = parseSiteSettings(exampleSettings);
    expect(settings).toEqual(exampleSettings);
    expect(Object.keys(settings)).toEqual([
      "version",
      "logo",
      "folders",
      "issues",
      "naming",
      "branches",
      "agentic",
    ]);
  });

  it("keeps omitted sections absent and preserves intentionally empty naming lists", () => {
    expect(parseSiteSettings({ version: 1 })).toEqual({ version: 1 });
    expect(parseSiteSettings({ version: 1, naming: { types: [], rules: [] } })).toEqual({
      version: 1,
      naming: { types: [], rules: [] },
    });
  });

  it("accepts a logo URL with optional alternative text", () => {
    expect(
      parseSiteSettings({ version: 1, logo: { url: " https://example.com/logo.svg " } }),
    ).toEqual({ version: 1, logo: { url: "https://example.com/logo.svg" } });
    expect(
      parseSiteSettings({ version: 1, logo: { url: "http://localhost/logo.png", alt: "Team" } })
        .logo,
    ).toEqual({ url: "http://localhost/logo.png", alt: "Team" });
  });

  it("accepts and normalizes an optional dark-mode logo URL", () => {
    expect(
      parseSiteSettings({
        version: 1,
        logo: {
          url: "https://example.com/logo.webp",
          darkUrl: " https://example.com/logo-white.webp ",
          alt: "Team",
        },
      }).logo,
    ).toEqual({
      url: "https://example.com/logo.webp",
      darkUrl: "https://example.com/logo-white.webp",
      alt: "Team",
    });
  });

  it.each([
    null,
    "",
    42,
    "/logo-white.webp",
    "javascript:alert(1)",
    "data:image/svg+xml,<svg/>",
    "ftp://example.com/logo.png",
    "https://user:password@example.com/logo.png",
  ])("rejects an invalid dark-mode logo URL: %j", (darkUrl) => {
    expect(() =>
      parseSiteSettings({ version: 1, logo: { url: "https://example.com/logo.webp", darkUrl } }),
    ).toThrow("darkUrl");
  });

  it.each([
    null,
    {},
    { darkUrl: "https://example.com/logo-white.webp" },
    { url: "/logo.svg" },
    { url: "javascript:alert(1)" },
    { url: "data:image/svg+xml,<svg/>" },
    { url: "ftp://example.com/logo.png" },
    { url: "https://user:password@example.com/logo.png" },
    { url: "https://example.com/logo.svg", alt: " " },
  ])("rejects invalid logo settings: %j", (logo) => {
    expect(() => parseSiteSettings({ version: 1, logo })).toThrow("logo");
  });

  it("accepts one document covering every section", () => {
    const settings = {
      version: 1,
      folders: {
        libraryName: "team-folders",
        manifestConfig: { activeIconPack: "none" },
        structures: [{ id: "source", name: "src", type: "folder" }],
        documentation: { source: "# Source" },
      },
      issues: issueSettings,
      naming: {
        title: "Our naming",
        intro: "Keep it concise.",
        types: [{ prefix: "fix", description: "Bug fixes", example: "fix: restore service" }],
        example: { title: "fix: restore service", description: "Repairs a broken service." },
        rules: [{ title: "Be brief", description: "One line." }],
      },
      branches: {
        libraryName: "team-flow",
        branches: [{ id: "main", label: "main", kind: "trunk" }],
        edges: [],
      },
      agentic: {
        harness: {
          name: "Team harness",
          readme: "# Workspace",
          source: "https://example.com/#workspace",
        },
        "agents-md": { readme: "# AGENTS.md\nRun pnpm test." },
      },
    };
    expect(parseSiteSettings(settings)).toEqual(settings);
  });

  it("normalizes documentation keys and canonical issue references without changing node IDs", () => {
    const result = parseSiteSettings({
      version: 1,
      issues: {
        ...issueSettings,
        documentation: { "BUG-ID": "# Bug" },
        examples: [{ ...issueExample, labels: ["BUG-ID", "URGENT"], status: "DOING" }],
      },
    });
    expect(result.issues?.documentation).toEqual({ "bug-id": "# Bug" });
    expect(result.issues?.examples).toEqual([issueExample]);
    expect(result.issues?.structures).toEqual(issueTree);
  });

  it("does not invent sample issues or documentation for custom profiles", () => {
    expect(
      parseSiteSettings({ version: 1, issues: { libraryName: "empty", structures: [] } }).issues,
    ).toEqual({ libraryName: "empty", structures: [] });
  });

  it.each([
    [{}, "version"],
    [{ version: 2 }, "version"],
    [{ version: 1, folders: null }, "folders"],
    [{ version: 1, naming: { types: [{ prefix: "fix" }] } }, "naming.types.0.description"],
    [
      {
        version: 1,
        branches: { libraryName: "bad", branches: [], edges: [{ from: "a", to: "b" }] },
      },
      "branches",
    ],
    [{ version: 1, agentic: { unknown: { name: "Unknown" } } }, "agentic.unknown"],
    [
      { version: 1, agentic: { harness: { source: "javascript:alert(1)" } } },
      "agentic.harness.source",
    ],
  ])("rejects malformed sections with their field paths", (value, field) => {
    expect(() => parseSiteSettings(value)).toThrow(field);
  });

  it("reuses tree identity validation and validates nested priority content", () => {
    expect(() =>
      parseSiteSettings({
        version: 1,
        folders: {
          libraryName: "team",
          structures: [
            { name: "src", type: "folder" },
            { name: "SRC", type: "file" },
          ],
        },
      }),
    ).toThrow("folders.structures: Duplicate structure ID");
    expect(() =>
      parseSiteSettings({
        version: 1,
        issues: {
          libraryName: "team",
          structures: [
            {
              name: "priority",
              type: "folder",
              children: [{ name: "urgent", type: "file", example: 2 }],
            },
          ],
        },
      }),
    ).toThrow("issues.structures.0.children.0.example");
  });

  it.each([
    [{ ghost: "Missing node" }, "Unknown structure ID"],
    [{ "bug-id": "# Bug", "BUG-ID": "Duplicate" }, "Duplicate documentation ID"],
  ])("rejects documentation that cannot identify one node", (documentation, message) => {
    expect(() =>
      parseSiteSettings({ version: 1, issues: { ...issueSettings, documentation } }),
    ).toThrow(message);
  });

  it.each([
    [{ labels: ["missing"] }, "issues.examples.0.labels.0"],
    [{ labels: ["types"] }, "issues.examples.0.labels.0"],
    [{ labels: ["doing"] }, "issues.examples.0.labels.0"],
    [{ labels: ["bug-id", "BUG-ID"] }, "cannot repeat a label"],
    [{ status: "bug-id" }, "issues.examples.0.status"],
    [{ number: 0 }, "issues.examples.0.number"],
    [{ openedDaysAgo: -1 }, "issues.examples.0.openedDaysAgo"],
    [{ comments: 1.5 }, "issues.examples.0.comments"],
    [{ open: "yes" }, "issues.examples.0.open"],
  ])("validates issue counts, flags and taxonomy references", (changes, field) => {
    expect(() =>
      parseSiteSettings({
        version: 1,
        issues: { ...issueSettings, examples: [{ ...issueExample, ...changes }] },
      }),
    ).toThrow(field);
  });

  it("rejects duplicate issue numbers and cannot override Agentic structure", () => {
    expect(() =>
      parseSiteSettings({
        version: 1,
        issues: { ...issueSettings, examples: [issueExample, issueExample] },
      }),
    ).toThrow("issues.examples.1.number: Duplicate issue number");
    expect(
      parseSiteSettings({ version: 1, agentic: { harness: { id: "other", includes: [] } } })
        .agentic,
    ).toEqual({ harness: {} });
  });
});

describe("site settings URLs and requests", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes HTTP(S) input and rejects unsupported or credential-bearing URLs", () => {
    expect(normalizeSettingsUrl("  HTTPS://EXAMPLE.COM/settings.json#file  ")).toBe(
      "https://example.com/settings.json",
    );
    for (const value of [
      "",
      "/assets/settings.json",
      "javascript:alert(1)",
      "ftp://example.com/settings.json",
      "https://user:pass@example.com/settings.json",
    ]) {
      expect(() => normalizeSettingsUrl(value)).toThrow();
    }
  });

  it("loads a raw JSON URL with the caller's abort signal", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ version: 1 }));
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    await expect(fetchSiteSettings(rawUrl, controller.signal)).resolves.toEqual({ version: 1 });
    expect(fetch).toHaveBeenCalledExactlyOnceWith(rawUrl, {
      signal: controller.signal,
      cache: "no-cache",
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
  });

  it.each([
    ["https://gist.github.com/team/abc123#file-settings-json", "abc123"],
    ["https://gist.github.com/abc123", "abc123"],
    ["https://gist.github.com/team/abc123/def456", "abc123/def456"],
  ])("resolves a Gist page through its settings.json file", async (source, id) => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ files: { "settings.json": { raw_url: rawUrl } } }))
      .mockResolvedValueOnce(Response.json({ version: 1 }));
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    await expect(fetchSiteSettings(source, controller.signal)).resolves.toEqual({ version: 1 });
    expect(fetch).toHaveBeenNthCalledWith(1, `https://api.github.com/gists/${id}`, {
      signal: controller.signal,
      cache: "no-cache",
      credentials: "omit",
      headers: { Accept: "application/vnd.github+json" },
    });
    expect(fetch).toHaveBeenNthCalledWith(2, rawUrl, {
      signal: controller.signal,
      cache: "no-cache",
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
  });

  it("reports missing Gist settings files", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ files: { "other.json": {} } })),
    );
    await expect(fetchSiteSettings("https://gist.github.com/team/abc123")).rejects.toThrow(
      "file named settings.json",
    );
  });

  it("reports malformed JSON, invalid settings, API failures and network failures", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("{broken"))
      .mockResolvedValueOnce(Response.json({ version: 0 }))
      .mockResolvedValueOnce(new Response("", { status: 403 }))
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetch);
    await expect(fetchSiteSettings(rawUrl)).rejects.toThrow("website settings is not valid JSON");
    await expect(fetchSiteSettings(rawUrl)).rejects.toThrow("version");
    await expect(fetchSiteSettings("https://gist.github.com/team/abc123")).rejects.toThrow(
      "GitHub Gist (403)",
    );
    await expect(fetchSiteSettings(rawUrl)).rejects.toThrow("website settings (404)");
    await expect(fetchSiteSettings(rawUrl)).rejects.toThrow("Failed to fetch");
  });

  it("does not fetch already-aborted requests or continue an aborted Gist resolution", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    controller.abort();
    await expect(fetchSiteSettings(rawUrl, controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(fetch).not.toHaveBeenCalled();

    const next = new AbortController();
    fetch.mockImplementationOnce(() => {
      next.abort();
      return Promise.resolve(Response.json({ files: { "settings.json": { raw_url: rawUrl } } }));
    });
    await expect(
      fetchSiteSettings("https://gist.github.com/team/abc123", next.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("rejects aborted raw responses even if the transport completes", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        controller.abort();
        return Promise.resolve(Response.json({ version: 1 }));
      }),
    );
    await expect(fetchSiteSettings(rawUrl, controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
