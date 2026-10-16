import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { checkDocumentation } from "../.agents/plugins/structures/skills/project-structures/scripts/check-documentation.mjs";

const pluginRoot = new URL("../.agents/plugins/structures/", import.meta.url);
const skillRoot = new URL("skills/project-structures/", pluginRoot);

test("the marketplace resolves a portable manifest with accessible skills and Codex icons", () => {
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
  for (const name of ["project-structures", "commit", "rename-assets"]) {
    const skill = readFileSync(new URL(`skills/${name}/SKILL.md`, pluginRoot), "utf8");
    assert.ok(skill.startsWith("---\n"));
    assert.match(skill, new RegExp(`^name: ${name}$`, "m"));
    assert.ok(
      readFileSync(new URL(`skills/${name}/agents/openai.yaml`, pluginRoot), "utf8").length,
    );
  }
  const { interface: listing } = manifest.extensions["com.openai"];
  for (const field of ["composerIcon", "logo"]) {
    assert.ok(readFileSync(new URL(listing[field], pluginRoot)).length);
  }
  assert.ok(readFileSync(new URL("LICENSE", pluginRoot), "utf8").includes("MIT License"));
});

const example = JSON.parse(
  readFileSync(new URL("assets/settings.example.json", skillRoot), "utf8"),
);

test("accepts the distributed example with complete documentation", () => {
  assert.equal(checkDocumentation(example), 9);
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
    assert.equal(checkDocumentation(profile), 9);
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
  assert.ok(readFileSync(join(directory, "references/profile-format.md"), "utf8").length);
  const checker = join(directory, "scripts/check-documentation.mjs");
  const linkedChecker = join(directory, "linked-checker.mjs");
  symlinkSync(checker, linkedChecker);
  for (const entrypoint of [checker, linkedChecker]) {
    const result = spawnSync(
      process.execPath,
      [entrypoint, join(directory, "assets/settings.example.json")],
      { cwd: directory, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Checked 9 folder nodes/);
  }
  const missingInput = spawnSync(process.execPath, [checker], { cwd: directory, encoding: "utf8" });
  assert.equal(missingInput.status, 1);
  assert.match(missingInput.stderr, /Usage:/);
});
