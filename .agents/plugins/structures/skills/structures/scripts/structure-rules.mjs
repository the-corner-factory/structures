import assert from "node:assert/strict";
import { posix } from "node:path";

export function templateEntries(profile) {
  const entries = [];
  function visit(node, path) {
    entries.push({ node, path });
    for (const child of node.children ?? []) visit(child, posix.join(path, child.name));
  }
  visit(profile.folders.structures[0], "");
  return entries;
}

export function relativePath(value) {
  assert.ok(
    typeof value === "string" &&
      value &&
      !/[\\\u0000-\u001f:*?"<>|]/.test(value) &&
      value.split("/").every((part) => part && part !== "." && part !== ".."),
    `Expected a literal project-relative path: ${value}`,
  );
  return value;
}

function keys(object, allowed) {
  assert.ok(object && typeof object === "object" && !Array.isArray(object), "Expected an object.");
  for (const key of Object.keys(object))
    assert.ok(allowed.includes(key), `Unknown rule field: ${key}`);
}

function glob(value) {
  assert.ok(typeof value === "string" && value.trim(), "A match needs a nonempty glob.");
  assert.ok(
    !value.startsWith("/") && !value.includes("\\") && !value.split("/").includes(".."),
    `Globs must be relative to their documentation folder: ${value}`,
  );
}

export function expression(value) {
  assert.equal(typeof value, "string", "Patterns must be strings.");
  assert.ok(value.length > 0, "Patterns must not be empty.");
  return new RegExp(`^(?:${value})$`, "u");
}

export function readRules(profile) {
  const scopes = [];
  for (const { node, path } of templateEntries(profile)) {
    const markdown = profile.folders.documentation[node.id.toLowerCase()];
    const openings = [...markdown.matchAll(/^```structures-rules[^\r\n]*$/gm)];
    const blocks = [...markdown.matchAll(/^```structures-rules\s*\r?\n([\s\S]*?)^```[ \t]*$/gm)];
    assert.equal(openings.length, blocks.length, `Malformed structures-rules block in ${node.id}`);
    assert.ok(blocks.length <= 1, `Only one structures-rules block is allowed in ${node.id}`);
    if (!blocks.length) continue;
    assert.notEqual(node.type, "file", `Rules belong to a folder or root: ${node.id}`);
    const policy = JSON.parse(blocks[0][1]);
    keys(policy, ["ignore", "required", "rules"]);
    for (const field of ["ignore", "required", "rules"]) {
      assert.ok(
        policy[field] === undefined || Array.isArray(policy[field]),
        `${field} must be an array.`,
      );
    }
    for (const pattern of policy.ignore ?? []) glob(pattern);
    for (const path of policy.required ?? []) relativePath(path);
    const ids = new Set();
    for (const rule of policy.rules ?? []) {
      keys(rule, ["id", "match", "kind", "exclude", "case", "name", "path", "rename", "ownership"]);
      assert.ok(typeof rule.id === "string" && rule.id.trim(), "Rules need an id.");
      assert.ok(!ids.has(rule.id), `Duplicate rule id: ${rule.id}`);
      ids.add(rule.id);
      glob(rule.match);
      assert.ok([undefined, "file", "folder"].includes(rule.kind), `Invalid kind: ${rule.kind}`);
      assert.ok(
        rule.exclude === undefined || Array.isArray(rule.exclude),
        "exclude must be an array.",
      );
      for (const pattern of rule.exclude ?? []) glob(pattern);
      assert.ok([undefined, "kebab-case"].includes(rule.case), `Unsupported casing: ${rule.case}`);
      for (const field of ["name", "path"]) if (rule[field] !== undefined) expression(rule[field]);
      if (rule.rename !== undefined) {
        keys(rule.rename, ["pattern", "replacement"]);
        expression(rule.rename.pattern);
        assert.equal(
          typeof rule.rename.replacement,
          "string",
          "rename.replacement must be a string.",
        );
      }
      if (rule.ownership !== undefined) {
        keys(rule.ownership, ["core", "shared", "owners"]);
        assert.ok(!rule.kind || rule.kind === "file", "Ownership rules apply to source files.");
        const { core, shared, owners } = rule.ownership;
        relativePath(core);
        relativePath(shared);
        assert.ok(
          !core.startsWith(`${shared}/`) && !shared.startsWith(`${core}/`),
          "Core and shared ownership paths must be equal or separate directories.",
        );
        assert.ok(Array.isArray(owners) && owners.length, "Ownership needs child-folder globs.");
        for (const owner of owners) glob(owner);
        assert.ok(
          !rule.rename && !rule.case,
          "Keep ownership and filename mappings in separate rules.",
        );
      }
      assert.ok(
        ["case", "name", "path", "rename", "ownership"].some((field) => rule[field] !== undefined),
        `Rule ${rule.id} needs a constraint.`,
      );
    }
    scopes.push({ path, nodeId: node.id, ...policy });
  }
  return scopes;
}
