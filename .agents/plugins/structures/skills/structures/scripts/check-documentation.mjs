import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// This checks export coverage; the website's parseSiteSettings owns full profile validation.
export function checkDocumentation(profile) {
  assert.ok(
    profile && typeof profile === "object" && !Array.isArray(profile),
    "The profile must be an object.",
  );
  assert.equal(profile.version, 1, "The profile version must be 1.");
  const folders = profile.folders;
  assert.ok(
    folders && typeof folders === "object" && !Array.isArray(folders),
    "A generated guide needs folders.",
  );
  assert.ok(
    typeof folders.libraryName === "string" && folders.libraryName.trim(),
    "folders.libraryName must be nonempty.",
  );
  if (folders.manifestConfig !== undefined) {
    assert.ok(
      folders.manifestConfig &&
        typeof folders.manifestConfig === "object" &&
        !Array.isArray(folders.manifestConfig),
      "folders.manifestConfig must be an object.",
    );
  }
  const ids = new Set();
  function visit(nodes) {
    assert.ok(Array.isArray(nodes), "Structure children must be an array.");
    for (const node of nodes) {
      assert.ok(node && typeof node === "object", "Each node must be an object.");
      assert.ok(typeof node.name === "string" && node.name.trim(), "A node needs a name.");
      assert.ok(["container", "folder", "file"].includes(node.type), "Invalid node type.");
      for (const field of ["color", "bgColor", "description", "example"]) {
        assert.ok(
          node[field] === undefined || typeof node[field] === "string",
          `${field} must be a string for ${node.name}.`,
        );
      }
      assert.ok(
        typeof node.id === "string" &&
          node.id.trim() &&
          ![".", ".."].includes(node.id) &&
          !/[/\\\u0000-\u001f]/.test(node.id),
        "Each generated node needs an explicit single-segment ID.",
      );
      const id = node.id.toLowerCase();
      assert.ok(!ids.has(id), `Duplicate node ID: ${node.id}`);
      ids.add(id);
      if (node.children !== undefined) {
        assert.ok(Array.isArray(node.children), "Structure children must be an array.");
        assert.ok(node.type !== "file" || !node.children.length, "Files cannot have children.");
        visit(node.children);
      }
    }
  }
  visit(folders.structures);
  assert.ok(ids.size, "A generated guide needs at least one node.");
  const docs = folders.documentation;
  assert.ok(docs && typeof docs === "object" && !Array.isArray(docs), "Missing documentation.");
  for (const [id, markdown] of Object.entries(docs)) {
    assert.equal(id, id.toLowerCase(), `Documentation keys must be lowercase: ${id}`);
    assert.ok(ids.has(id), `Documentation references an unknown node: ${id}`);
    assert.ok(typeof markdown === "string" && markdown.trim(), `Empty documentation: ${id}`);
  }
  for (const id of ids) assert.ok(Object.hasOwn(docs, id), `Missing documentation: ${id}`);
  return ids.size;
}

if (import.meta.main) {
  assert.ok(process.argv[2], "Usage: node check-documentation.mjs <settings.json>");
  const count = checkDocumentation(JSON.parse(readFileSync(process.argv[2], "utf8")));
  console.log(`Checked ${count} folder nodes with complete inline documentation.`);
}
