import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { test } from "node:test";

import { checkDocumentation } from "../.agents/plugins/structures/skills/structures/scripts/check-documentation.mjs";
import { checkStructure } from "../.agents/plugins/structures/skills/structures/scripts/check-structure.mjs";
import { checkTemplate } from "../.agents/plugins/structures/skills/structures/scripts/check-template.mjs";
import { fixStructure } from "../.agents/plugins/structures/skills/structures/scripts/fix-structure.mjs";

const pluginRoot = new URL("../.agents/plugins/structures/", import.meta.url);
const skillRoot = new URL("skills/structures/", pluginRoot);

test("the marketplace exposes one unified skill with Codex metadata and icons", () => {
  const root = new URL("../", import.meta.url);
  const marketplace = JSON.parse(
    readFileSync(new URL(".agents/plugins/marketplace.json", root), "utf8"),
  );
  const entry = marketplace.plugins.find((plugin) => plugin.name === "structures");
  assert.equal(entry.source.source, "local");
  assert.equal(new URL(`${entry.source.path}/`, root).href, pluginRoot.href);
  const manifest = JSON.parse(readFileSync(new URL("plugin.json", pluginRoot), "utf8"));
  assert.equal(manifest.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
  assert.equal(manifest.name, entry.name);
  assert.deepEqual(readdirSync(new URL("skills/", pluginRoot)), ["structures"]);
  const skill = readFileSync(new URL("SKILL.md", skillRoot), "utf8");
  assert.ok(skill.startsWith("---\n"));
  assert.match(skill, /^name: structures$/m);
  assert.ok(readFileSync(new URL("agents/openai.yaml", skillRoot), "utf8").length);
  const { interface: listing } = manifest.extensions["com.openai"];
  for (const field of ["composerIcon", "logo"]) {
    assert.ok(readFileSync(new URL(listing[field], pluginRoot)).length);
  }
  assert.ok(readFileSync(new URL("LICENSE", pluginRoot), "utf8").includes("MIT License"));
});

const example = JSON.parse(readFileSync(new URL("assets/config.example.json", skillRoot), "utf8"));

test("accepts the distributed example with complete documentation", () => {
  assert.equal(checkDocumentation(example), 13);
  assert.equal(checkTemplate(example), 13);
});

test("rejects template roots and names that cannot describe project-relative paths", () => {
  const profile = structuredClone(example);
  const root = profile.folders.structures[0];
  root.type = "folder";
  assert.throws(() => checkTemplate(profile), /one project-root container/);
  root.type = "container";
  root.children[0].type = "container";
  assert.throws(() => checkTemplate(profile), /Only the project root/);
  root.children[0].type = "folder";
  for (const name of [".", "..", "nested/path", "nested\\path", "bad\u0000name"]) {
    root.children[0].name = name;
    assert.throws(() => checkTemplate(profile), /single path segments/);
  }
});

test("rejects case-insensitive template path collisions even with unique IDs", () => {
  const profile = structuredClone(example);
  profile.folders.structures[0].children.push({ id: "other-src", name: "SRC", type: "folder" });
  profile.folders.documentation["other-src"] = "A duplicate destination.";
  assert.throws(() => checkTemplate(profile), /Duplicate template path: src/);
});

test("accepts the repository's maintained folder template", () => {
  const config = JSON.parse(
    readFileSync(new URL("../.agents/configs/.structures/config.json", import.meta.url)),
  );
  assert.ok(checkTemplate(config) > 0);
});

test("rejects duplicate IDs even when their case differs", () => {
  const profile = structuredClone(example);
  profile.folders.structures.push({ id: "STRUCTURES", name: "other", type: "folder" });
  assert.throws(() => checkDocumentation(profile), /Duplicate node ID/);
});

test("rejects missing or unrelated documentation", () => {
  const profile = structuredClone(example);
  delete profile.folders.documentation["structures-glossary"];
  assert.throws(() => checkDocumentation(profile), /Missing documentation/);
  profile.folders.documentation.unknown = "A document without a node.";
  assert.throws(() => checkDocumentation(profile), /unknown node/);
});

test("rejects path IDs and file children", () => {
  const profile = structuredClone(example);
  profile.folders.structures[0].id = "src/components";
  assert.throws(() => checkDocumentation(profile), /single-segment ID/);
  profile.folders.structures[0].id = "structures";
  profile.folders.structures[0].type = "file";
  assert.throws(() => checkDocumentation(profile), /Files cannot have children/);
});

test("checks optional node field types throughout the folder tree", () => {
  for (const field of ["color", "bgColor", "description", "example"]) {
    const profile = structuredClone(example);
    const node = profile.folders.structures[0].children[0];
    for (const value of [42, null, {}, []]) {
      node[field] = value;
      assert.throws(() => checkDocumentation(profile), new RegExp(`${field} must be a string`));
    }
    node[field] = "";
    assert.equal(checkDocumentation(profile), 13);
  }
});

test("rejects invalid profile roots and folder manifest configuration", () => {
  for (const value of [null, [], "profile"]) {
    assert.throws(() => checkDocumentation(value), /profile must be an object/);
  }
  for (const manifestConfig of [null, [], "icons"]) {
    const profile = structuredClone(example);
    profile.folders.manifestConfig = manifestConfig;
    assert.throws(() => checkDocumentation(profile), /manifestConfig must be an object/);
  }
});

test("the detached skill runs without the application or installed dependencies", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "structures skill "));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  cpSync(skillRoot, directory, { recursive: true });
  cpSync(new URL("LICENSE", pluginRoot), join(directory, "LICENSE"));
  for (const filename of readdirSync(directory, { recursive: true }).filter((path) =>
    path.endsWith(".md"),
  )) {
    const file = join(directory, filename);
    for (const [, target] of readFileSync(file, "utf8").matchAll(/\]\(([^)]+)\)/g)) {
      if (target.includes("://") || target.startsWith("#")) continue;
      const linkedFile = resolve(dirname(file), target.split("#")[0]);
      assert.ok(
        linkedFile.startsWith(`${directory}${sep}`),
        `${filename}: external resource ${target}`,
      );
      assert.ok(existsSync(linkedFile), `${filename}: missing resource ${target}`);
    }
  }
  const checker = join(directory, "scripts/check-documentation.mjs");
  const linkedChecker = join(directory, "linked-checker.mjs");
  symlinkSync(checker, linkedChecker);
  for (const entrypoint of [
    checker,
    linkedChecker,
    join(directory, "scripts/check-template.mjs"),
  ]) {
    const result = spawnSync(
      process.execPath,
      [entrypoint, join(directory, "assets/config.example.json")],
      { cwd: directory, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Checked 13 folder(?: template)? nodes/);
  }
  const missingInput = spawnSync(process.execPath, [checker], { cwd: directory, encoding: "utf8" });
  assert.equal(missingInput.status, 1);
  assert.match(missingInput.stderr, /Usage:/);
});

function projectFixture(t, policy, files = {}, { typescript = false, git = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "structures project "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const config = join(root, ".agents/configs/.structures/config.json");
  const profile = {
    version: 1,
    folders: {
      libraryName: "Test",
      structures: [{ id: "root", name: "Test", type: "container", children: [] }],
      documentation: {
        root: `# Project\n\n\`\`\`structures-rules\n${JSON.stringify(policy)}\n\`\`\`\n`,
      },
    },
  };
  for (const [path, content] of Object.entries({
    ".agents/configs/.structures/config.json": JSON.stringify(profile),
    ...files,
  })) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  if (typescript) {
    mkdirSync(join(root, "node_modules"), { recursive: true });
    symlinkSync(resolve("node_modules/typescript"), join(root, "node_modules/typescript"), "dir");
    writeFileSync(
      join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          module: "ESNext",
          moduleResolution: "Bundler",
          allowImportingTsExtensions: true,
          noEmit: true,
          paths: { "@/*": ["./src/*"] },
        },
        include: ["src/**/*.ts"],
      }),
    );
  }
  if (git) execFileSync("git", ["init", "-q", root]);
  return { root, config, profile };
}

const casing = { id: "kebab", match: "src/**/*.ts", case: "kebab-case" };
const storeRename = {
  id: "store",
  match: "src/**/*-store.ts",
  rename: {
    pattern: "src/(.*)-store\\.ts",
    replacement: "src/stores/$1.store.ts",
  },
};

test("checks actual filenames, folder names, required paths and locations without writes", (t) => {
  const { root, config } = projectFixture(
    t,
    {
      required: ["README.md"],
      rules: [
        casing,
        { id: "folders", kind: "folder", match: "src/*", case: "kebab-case" },
        { id: "stores", match: "src/**/*.store.ts", path: "src/stores/.*\\.store\\.ts" },
        { id: "tests", match: "src/**/*.test.ts", name: "[a-z-]+\\.test\\.ts" },
      ],
    },
    {
      "src/UserCard.ts": "",
      "src/MyFeature/file.ts": "",
      "src/cart.store.ts": "",
      "other.txt": "",
    },
  );
  const original = readFileSync(config, "utf8");
  const result = checkStructure(root);
  assert.ok(result.findings.some((finding) => finding.destination === "src/user-card.ts"));
  assert.ok(result.findings.some((finding) => finding.destination === "src/my-feature"));
  assert.ok(result.findings.some((finding) => finding.code === "path"));
  assert.ok(result.findings.some((finding) => finding.code === "required"));
  assert.equal(readFileSync(config, "utf8"), original);
  assert.ok(existsSync(join(root, "src/UserCard.ts")));
  assert.equal(checkStructure(root, "other.txt").findings.length, 0);
});

test("rules are folder-scoped, exclusions apply and curated missing entries remain optional", (t) => {
  const { root, config, profile } = projectFixture(
    t,
    {},
    {
      "src/GoodFile.ts": "",
      "src/generated/BadFile.ts": "",
      "src/SpecialRoute.ts": "",
      "OtherFile.ts": "",
    },
  );
  profile.folders.structures[0].children = [
    { id: "src", name: "src", type: "folder" },
    { id: "example", name: "example.txt", type: "file" },
  ];
  profile.folders.documentation.example = "Optional curated example.";
  profile.folders.documentation.src =
    '```structures-rules\n{"ignore":["generated"],"rules":[{"id":"names","match":"**/*.ts","exclude":["SpecialRoute.ts"],"case":"kebab-case"}]}\n```';
  writeFileSync(config, JSON.stringify(profile));
  assert.deepEqual(
    checkStructure(root).findings.map((finding) => finding.path),
    ["src/GoodFile.ts"],
  );
});

test("rejects invalid and misspelled rules, malformed fences and escaping rename paths", (t) => {
  for (const policy of [
    { rulez: [] },
    { rules: [{ ...casing, casing: "camel" }] },
    { rules: [{ ...casing, name: "[" }] },
    { required: ["../secret"] },
    { rules: [casing, casing] },
    { rules: [{ id: "empty", match: "**" }] },
  ]) {
    const { profile } = projectFixture(t, policy);
    assert.throws(() => checkTemplate(profile));
  }
  const { root, profile } = projectFixture(
    t,
    {
      rules: [
        {
          ...storeRename,
          rename: {
            pattern: ".*",
            replacement: "../escape.ts",
          },
        },
      ],
    },
    { "src/cart-store.ts": "" },
  );
  assert.throws(() => checkStructure(root), /project-relative/);
  profile.folders.documentation.root = "```structures-rules\n{}";
  assert.throws(() => checkTemplate(profile), /Malformed/);
});

test("Git inventory respects ignores, includes untracked files and accepts required empty folders", (t) => {
  const { root } = projectFixture(
    t,
    { required: ["empty"], rules: [casing] },
    {
      ".gitignore": "src/generated/\n",
      "src/generated/BadFile.ts": "",
      "src/UntrackedFile.ts": "",
    },
    { git: true },
  );
  mkdirSync(join(root, "empty"));
  assert.deepEqual(
    checkStructure(root).findings.map((finding) => finding.path),
    ["src/UntrackedFile.ts"],
  );
});

test("check and fix CLIs share findings, exit codes, legacy config and detached execution", (t) => {
  const { root, config } = projectFixture(
    t,
    { rules: [{ id: "names", match: "*.txt", case: "kebab-case" }] },
    { "ReadMe.txt": "preserve" },
  );
  const detached = join(root, "installed skill");
  cpSync(skillRoot, detached, { recursive: true });
  const run = (command, ...args) =>
    spawnSync(
      process.execPath,
      [join(detached, `scripts/${command}-structure.mjs`), "--root", root, "--json", ...args],
      { encoding: "utf8" },
    );
  const audit = run("check");
  assert.equal(audit.status, 1, audit.stderr);
  assert.equal(JSON.parse(audit.stdout).findings[0].destination, "read-me.txt");
  const fixed = run("fix");
  assert.equal(fixed.status, 0, fixed.stderr);
  assert.deepEqual(JSON.parse(fixed.stdout).applied, [{ from: "ReadMe.txt", to: "read-me.txt" }]);
  assert.equal(readFileSync(join(root, "read-me.txt"), "utf8"), "preserve");
  assert.equal(run("check").status, 0);
  assert.deepEqual(JSON.parse(run("fix").stdout).applied, []);
  mkdirSync(join(root, ".structures"));
  cpSync(config, join(root, ".structures/config.json"));
  rmSync(config);
  assert.equal(JSON.parse(run("check").stdout).config, ".structures/config.json");
  assert.equal(run("check", "--unknown").status, 2);
});

test("fix uses TypeScript for relative imports, aliases, JS specifiers and moved-file imports", (t) => {
  const { root, config } = projectFixture(
    t,
    { rules: [storeRename] },
    {
      "src/cart-store.ts": 'import { value } from "./value.js";\nexport const cart = value;\n',
      "src/value.ts": "export const value = 1;\n",
      "src/main.ts":
        'import { cart } from "@/cart-store";\nexport { cart as other } from "./cart-store.js";\nconsole.log(cart);\n',
    },
    { typescript: true },
  );
  const originalConfig = readFileSync(config, "utf8");
  const result = fixStructure(root);
  assert.equal(result.findings.length, 0);
  assert.deepEqual(result.applied, [{ from: "src/cart-store.ts", to: "src/stores/cart.store.ts" }]);
  assert.match(readFileSync(join(root, "src/main.ts"), "utf8"), /@\/stores\/cart\.store/);
  assert.match(readFileSync(join(root, "src/main.ts"), "utf8"), /\.\/stores\/cart\.store\.js/);
  assert.match(readFileSync(join(root, "src/stores/cart.store.ts"), "utf8"), /\.\.\/value\.js/);
  assert.equal(readFileSync(config, "utf8"), originalConfig);
  assert.equal(existsSync(join(root, "src/cart-store.ts")), false);
});

test("fix refuses collisions and conflicting mappings before changing files", (t) => {
  const { root } = projectFixture(
    t,
    { rules: [casing] },
    { "src/UserCard.ts": "one", "src/user-card.ts": "two" },
  );
  assert.throws(() => fixStructure(root), /already exists/);
  assert.equal(readFileSync(join(root, "src/UserCard.ts"), "utf8"), "one");
  const other = projectFixture(
    t,
    {
      rules: [
        casing,
        {
          id: "other",
          match: "src/UserCard.ts",
          rename: { pattern: "src/UserCard.ts", replacement: "src/card.ts" },
        },
      ],
    },
    { "src/UserCard.ts": "" },
  );
  assert.throws(() => fixStructure(other.root), /Conflicting fixes/);
});

test("fix blocks unmanaged references and computed imports without writes", (t) => {
  for (const extra of [
    { "README.md": 'See "src/cart-store.ts".' },
    { "src/loader.ts": 'const name = "cart"; import(name);' },
    { "src/loader.ts": 'const items = import.meta.glob("./*.ts");' },
    { "package.json": '{"exports":"./src/cart-store.ts"}' },
  ]) {
    const { root } = projectFixture(
      t,
      { rules: [storeRename] },
      { "src/cart-store.ts": "export const cart = 1;", ...extra },
      { typescript: true },
    );
    assert.throws(() => fixStructure(root), /Unmanaged reference|Computed module|Glob-based/);
    assert.ok(existsSync(join(root, "src/cart-store.ts")));
    assert.equal(existsSync(join(root, "src/stores")), false);
  }
});

test("fix rolls back earlier moves and import edits when a later move is blocked", (t) => {
  const main = 'export { a } from "./a-store"; export { z } from "./z-store";';
  const { root } = projectFixture(
    t,
    { rules: [storeRename] },
    {
      "src/a-store.ts": "export const a = 1;",
      "src/z-store.ts": "export const z = 2;",
      "src/main.ts": main,
      "README.md": "src/z-store.ts",
    },
    { typescript: true },
  );
  assert.throws(() => fixStructure(root), /Unmanaged reference/);
  assert.equal(readFileSync(join(root, "src/main.ts"), "utf8"), main);
  assert.ok(existsSync(join(root, "src/a-store.ts")));
  assert.ok(existsSync(join(root, "src/z-store.ts")));
  assert.equal(existsSync(join(root, "src/stores")), false);
});

test("fix preserves Git staging and unrelated edits", (t) => {
  const { root } = projectFixture(
    t,
    { rules: [storeRename] },
    {
      "src/cart-store.ts": "export const cart = 1;",
      "src/main.ts": 'export { cart } from "./cart-store";',
      "unrelated.txt": "local work",
    },
    { typescript: true, git: true },
  );
  execFileSync("git", ["-C", root, "add", "src/main.ts"]);
  const index = readFileSync(join(root, ".git/index"));
  assert.throws(() => fixStructure(root), /staged file/);
  assert.deepEqual(readFileSync(join(root, ".git/index")), index);
  assert.equal(readFileSync(join(root, "unrelated.txt"), "utf8"), "local work");
  assert.ok(existsSync(join(root, "src/cart-store.ts")));
});

test("fix refuses symlink destinations, scope escapes and directories with ignored contents", (t) => {
  const { root } = projectFixture(
    t,
    { rules: [storeRename] },
    { "src/cart-store.ts": "export {};" },
    { git: true },
  );
  const external = mkdtempSync(join(tmpdir(), "structures outside "));
  t.after(() => rmSync(external, { recursive: true, force: true }));
  symlinkSync(external, join(root, "src/stores"), "dir");
  assert.throws(() => fixStructure(root), /Symlink path/);
  assert.deepEqual(readdirSync(external), []);
  rmSync(join(root, "src/stores"));
  assert.throws(() => fixStructure(root, "src/cart-store.ts"), /leaves --scope/);
  const directory = projectFixture(
    t,
    { rules: [{ id: "folders", match: "OldFolder", kind: "folder", case: "kebab-case" }] },
    { ".gitignore": "*.secret", "OldFolder/visible.txt": "", "OldFolder/private.secret": "keep" },
    { git: true },
  );
  assert.throws(() => fixStructure(directory.root), /ignored/);
  assert.ok(existsSync(join(directory.root, "OldFolder/private.secret")));
});

test("read-only constraints stay unresolved and fixes do not invent files or policy", (t) => {
  const { root, config } = projectFixture(
    t,
    { required: ["missing.ts"], rules: [{ id: "name", match: "*.txt", name: "specific\\.txt" }] },
    { "other.txt": "keep" },
  );
  const original = readFileSync(config);
  const result = fixStructure(root);
  assert.equal(result.findings.length, 2);
  assert.deepEqual(result.applied, []);
  assert.deepEqual(readFileSync(config), original);
  assert.equal(existsSync(join(root, "missing.ts")), false);
});

test("fix renames a folder and its source/companion files while retaining import validity", (t) => {
  const { root } = projectFixture(
    t,
    {
      rules: [
        {
          id: "folder",
          kind: "folder",
          match: "src/OldFeature",
          rename: {
            pattern: "src/OldFeature",
            replacement: "src/features/new-feature",
          },
        },
      ],
    },
    {
      "src/OldFeature/view.ts": "export const view = 1;",
      "src/OldFeature/view.test.ts": 'import { view } from "./view"; void view;',
      "src/OldFeature/view.css": "body { color: red; }",
      "src/main.ts": 'export { view } from "./OldFeature/view.js";',
    },
    { typescript: true },
  );
  const result = fixStructure(root);
  assert.equal(result.findings.length, 0);
  assert.ok(existsSync(join(root, "src/features/new-feature/view.css")));
  assert.match(readFileSync(join(root, "src/main.ts"), "utf8"), /features\/new-feature\/view\.js/);
  const checked = spawnSync(
    process.execPath,
    [resolve("node_modules/typescript/bin/tsc"), "-p", root],
    { encoding: "utf8" },
  );
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
});

test("fix supports case-only renames and refuses source moves without a compiler", (t) => {
  const { root } = projectFixture(
    t,
    { rules: [{ id: "case", match: "*.txt", case: "kebab-case" }] },
    { "FOO.txt": "keep" },
  );
  assert.equal(fixStructure(root).findings.length, 0);
  assert.ok(readdirSync(root).includes("foo.txt"));
  const asset = projectFixture(
    t,
    { rules: [{ id: "names", match: "*.PNG", case: "kebab-case" }] },
    { "MyImage.PNG": "keep" },
  );
  assert.equal(fixStructure(asset.root).findings.length, 0);
  assert.ok(existsSync(join(asset.root, "my-image.PNG")));
  const source = projectFixture(t, { rules: [casing] }, { "src/UserCard.ts": "export {};" });
  assert.throws(() => fixStructure(source.root), /TypeScript installed/);
  assert.ok(existsSync(join(source.root, "src/UserCard.ts")));
});

test("fix preserves staged paths when explicitly targeting a nested Git package", (t) => {
  const parent = projectFixture(t, {}, {}, { git: true });
  const child = projectFixture(
    t,
    { rules: [{ id: "names", match: "*.txt", case: "kebab-case" }] },
    { "UserFile.txt": "keep" },
  );
  const nested = join(parent.root, "packages/child");
  cpSync(child.root, nested, { recursive: true });
  execFileSync("git", ["-C", parent.root, "add", "packages/child/UserFile.txt"]);
  assert.throws(() => fixStructure(nested), /Staged path/);
  assert.ok(existsSync(join(nested, "UserFile.txt")));
});

test("Git checks use disk casing and preserve staging after a case-only filesystem rename", (t) => {
  const { root } = projectFixture(
    t,
    { rules: [{ id: "names", match: "*.txt", case: "kebab-case" }] },
    { "FOOBar.txt": "keep" },
    { git: true },
  );
  execFileSync("git", ["-C", root, "add", "FOOBar.txt"]);
  renameSync(join(root, "FOOBar.txt"), join(root, "temporary.txt"));
  renameSync(join(root, "temporary.txt"), join(root, "FooBar.txt"));
  assert.deepEqual(
    checkStructure(root).findings.map((finding) => finding.path),
    ["FooBar.txt"],
  );
  assert.throws(() => fixStructure(root), /Staged path/);
});
