import { describe, expect, it } from "vite-plus/test";

import { BRANCH_FLOWS, branchSource } from "./branches.ts";
import { branchesHead, explorerHead, pageHead } from "./seo.ts";

describe("page metadata", () => {
  it("keeps search and social previews aligned", () => {
    const { meta } = pageHead("Issue Labels & Types", "Understand issue labels.");
    expect(meta).toEqual([
      { title: "Issue Labels & Types | Structures" },
      { name: "description", content: "Understand issue labels." },
      { property: "og:title", content: "Issue Labels & Types | Structures" },
      { property: "og:description", content: "Understand issue labels." },
      { name: "twitter:title", content: "Issue Labels & Types | Structures" },
      { name: "twitter:description", content: "Understand issue labels." },
    ]);
  });

  it("distinguishes the folder chooser, libraries, and selected documents", () => {
    expect(explorerHead("folders", {}).meta[0].title).toBe(
      "Project Folder Structures | Structures",
    );
    expect(explorerHead("folders", { library: "angular" }).meta[0].title).toBe(
      "Angular Folder Structure | Structures",
    );
    expect(explorerHead("folders", { library: "user" }).meta[0].title).toBe(
      "Personal Folder Structure | Structures",
    );
    const document = explorerHead("folders", {
      library: "tanstack-react",
      element: "posts.$postId.tsx",
    });
    expect(document.meta[0].title).toBe(
      "posts.$postId.tsx — TanStack Start / React Folders | Structures",
    );
    expect(document.meta[1].content).toContain("posts.$postId.tsx");
    expect(
      explorerHead("issues", { library: "software", element: "In Progress" }).meta[0].title,
    ).toBe("In Progress — Software Issues | Structures");
  });

  it("uses the selected source instead of a stale library parameter", () => {
    for (const source of ["/assets/go", "/assets/go/", " /assets/go/settings.json "]) {
      expect(explorerHead("folders", { library: "angular", source }).meta[0].title).toBe(
        "Go Folder Structure | Structures",
      );
    }

    const source = "https://example.com/private-catalog/settings.json";
    const custom = explorerHead("issues", { library: "software", source });
    expect(custom.meta[0].title).toBe("Custom Issue Workflow | Structures");
    expect(JSON.stringify(custom)).not.toContain("Software");
    expect(JSON.stringify(custom)).not.toContain(source);
  });

  it("describes each branch preset and handles custom sources", () => {
    expect(branchesHead().meta[0].title).toBe("Git Branching Strategies | Structures");
    for (const preset of BRANCH_FLOWS) {
      for (const source of [branchSource(preset.dir), `${branchSource(preset.dir)}settings.json`]) {
        const { meta } = branchesHead(source);
        expect(meta[0].title).toBe(`${preset.name} Branching Strategy | Structures`);
        expect(meta[1].content).toContain(preset.name);
      }
    }
    expect(branchesHead("https://example.com/settings.json").meta[0].title).toBe(
      "Custom Git Branching Strategy | Structures",
    );
  });

  it("describes global profiles without exposing their URL or stale catalog metadata", () => {
    const settings = "https://example.com/team/settings.json";
    const folder = explorerHead("folders", { library: "angular", source: "/assets/go/", settings });
    expect(folder.meta[0].title).toBe("Custom Folder Structure | Structures");
    const branch = branchesHead(branchSource("git-flow"), settings);
    expect(branch.meta[0].title).toBe("Custom Git Branching Strategy | Structures");
    expect(JSON.stringify([folder, branch])).not.toContain(settings);
  });
});
