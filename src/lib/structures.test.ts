import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

import {
  EXPLORER_FRAMEWORKS,
  filterStructures,
  librarySource,
  markdownDocumentUrl,
  settingsDocumentUrl,
  type FolderSettings,
  type FolderStructure,
} from "./structures.ts";

const tree: FolderStructure[] = [
  {
    name: "src",
    type: "folder",
    children: [
      { name: "components", type: "folder" },
      { name: "main.ts", type: "file" },
    ],
  },
  { name: "README.md", type: "file" },
];

describe("structure URLs", () => {
  it("resolves local settings and encoded markdown documents", () => {
    expect(settingsDocumentUrl("/assets/angular")).toBe("/assets/angular/settings.json");
    expect(markdownDocumentUrl("/assets/software/", "In Progress")).toBe(
      "/assets/software/md/in%20progress.md",
    );
  });

  it("resolves unprefixed status and type labels to their markdown documents", () => {
    expect(markdownDocumentUrl("/assets/software/", "Wont fix")).toBe(
      "/assets/software/md/wont%20fix.md",
    );
    expect(markdownDocumentUrl("/assets/software/", "Bug")).toBe("/assets/software/md/bug.md");
  });

  it("uses a remote JSON document without rewriting it", () => {
    const gist = "https://gist.githubusercontent.com/example/raw/settings.json";
    expect(settingsDocumentUrl(gist)).toBe(gist);
    expect(markdownDocumentUrl(gist, "README.md")).toBe(
      "https://gist.githubusercontent.com/example/raw/md/readme.md.md",
    );
  });

  it.each(["posts.$postId.tsx", "{-$lang}", "{-$lang}.tsx", "robots[.]txt.ts", "sitemap[.]xml.ts"])(
    "keeps %s compatible with Vite's public asset lookup",
    (name) => {
      expect(markdownDocumentUrl("/assets/tanstack-react/", name)).toBe(
        `/assets/tanstack-react/md/${name.toLowerCase()}.md`,
      );
    },
  );
});

describe("filterStructures", () => {
  it("keeps matching ancestors and removes unrelated branches", () => {
    expect(filterStructures(tree, "components")).toEqual([
      {
        name: "src",
        type: "folder",
        children: [{ name: "components", type: "folder" }],
      },
    ]);
  });
});

describe("built-in Angular documentation", () => {
  it("provides an explanation for every tree entry", async () => {
    const assetDirectory = fileURLToPath(new URL("../../public/assets/angular/", import.meta.url));
    const settings = JSON.parse(
      await readFile(join(assetDirectory, "settings.json"), "utf8"),
    ) as FolderSettings;
    const documents = new Set(await readdir(join(assetDirectory, "md")));
    const missing = structureNames(settings.structures).filter(
      (name) => !documents.has(`${name.toLowerCase()}.md`),
    );

    expect(missing).toEqual([]);
  });
});

describe("built-in TanStack Start / React documentation", () => {
  it("registers the library under Monorepo and documents every unique entry", async () => {
    const groups = EXPLORER_FRAMEWORKS.folders.filter((group) =>
      group.children.some((framework) => framework.library === "tanstack-react"),
    );
    expect(groups).toEqual([
      {
        name: "Monorepo",
        children: [{ name: "TanStack Start / React", library: "tanstack-react" }],
      },
    ]);

    const assetDirectory = fileURLToPath(
      new URL("../../public/assets/tanstack-react/", import.meta.url),
    );
    const settings = JSON.parse(
      await readFile(join(assetDirectory, "settings.json"), "utf8"),
    ) as FolderSettings;
    expect(librarySource(settings.libraryName)).toBe("/assets/tanstack-react/");

    const names = structureNames(settings.structures);
    const filenames = names.map((name) => `${name.toLowerCase()}.md`);
    expect(new Set(filenames).size).toBe(names.length);
    expect((await readdir(join(assetDirectory, "md"))).sort()).toEqual([...filenames].sort());

    const paths = new Map(structurePaths(settings.structures));
    for (const filename of filenames) {
      const markdown = await readFile(join(assetDirectory, "md", filename), "utf8");
      expect(markdown, filename).toContain(`**Path:** \`${paths.get(filename)}`);
      expect(markdown, filename).toMatch(/^# /);
      expect(markdown, filename).toContain("**Path:**");
      expect(markdown, filename).toContain("## Purpose");
      expect(markdown, filename).toContain("## Guidelines");
    }
  });
});

function structureNames(items: FolderStructure[]): string[] {
  return items.flatMap((item) => [
    item.id ?? item.name,
    ...(item.children ? structureNames(item.children) : []),
  ]);
}

describe("catalog identity compatibility", () => {
  it.each(["angular", "go", "tanstack-react"])(
    "keeps skill configuration separate from workflows in %s",
    async (library) => {
      const assetDirectory = new URL(`../../public/assets/${library}/`, import.meta.url);
      const settings = JSON.parse(
        await readFile(new URL("settings.json", assetDirectory), "utf8"),
      ) as FolderSettings;
      const paths = new Map(structurePaths(settings.structures));

      expect(paths.get("skills.md")).toBe(".agents/skills");
      for (const [filename, path] of [
        ["agents-configs.md", ".agents/configs"],
        [".structures.md", ".agents/configs/.structures"],
        ["config.json.md", ".agents/configs/.structures/config.json"],
      ]) {
        expect(paths.get(filename)).toBe(path);
        expect(await readFile(new URL(`md/${filename}`, assetDirectory), "utf8")).toContain(
          `**Path:** \`${path}\``,
        );
      }
      if (library === "go") expect(paths.get("configs.md")).toBe("configs");
    },
  );

  it("validates every catalog and preserves the old TanStack layout IDs", async () => {
    const { parseStructures, nodeId } = await import("./structures.ts");
    const { flattenStructures } = await import("../components/structures/structure-data");
    for (const library of ["angular", "go", "software", "user", "tanstack-react"]) {
      const settings = JSON.parse(
        await readFile(
          new URL(`../../public/assets/${library}/settings.json`, import.meta.url),
          "utf8",
        ),
      ) as FolderSettings;
      expect(() => parseStructures(settings.structures)).not.toThrow();
      if (library === "tanstack-react") {
        const nodes = flattenStructures(settings.structures);
        for (const id of ["_auth.tsx", "_public.tsx", "{-$lang}.tsx", "posts.tsx"]) {
          expect(nodes.find((node) => nodeId(node) === id)?.name).toBe("route.tsx");
        }
        expect(nodes.filter((node) => node.name === "index.tsx")).toHaveLength(2);
      }
    }
  });
});

function structurePaths(items: FolderStructure[], parent = ""): Array<[string, string]> {
  return items.flatMap((item) => {
    const path = parent + item.name;
    return [
      [`${(item.id ?? item.name).toLowerCase()}.md`, path] as [string, string],
      ...structurePaths(item.children ?? [], `${path}/`),
    ];
  });
}
