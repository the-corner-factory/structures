import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { checkDocumentation } from "./check-documentation.mjs";

export function checkTemplate(profile) {
  const count = checkDocumentation(profile);
  const roots = profile.folders.structures;
  assert.ok(
    roots.length === 1 && roots[0].type === "container",
    "A folder template needs one project-root container.",
  );
  const paths = new Set();
  function visit(nodes, parent) {
    for (const node of nodes) {
      assert.ok(node.type !== "container", "Only the project root can be a container.");
      assert.ok(
        ![".", ".."].includes(node.name) && !/[/\\\u0000-\u001f]/.test(node.name),
        `Template names must be single path segments: ${node.name}`,
      );
      const path = `${parent}${node.name}`.toLowerCase();
      assert.ok(!paths.has(path), `Duplicate template path: ${path}`);
      paths.add(path);
      visit(node.children ?? [], `${path}/`);
    }
  }
  visit(roots[0].children ?? [], "");
  return count;
}

if (import.meta.main) {
  assert.ok(process.argv[2], "Usage: node check-template.mjs <.structures/config.json>");
  const count = checkTemplate(JSON.parse(readFileSync(process.argv[2], "utf8")));
  console.log(`Checked ${count} folder template nodes with complete inline documentation.`);
}
