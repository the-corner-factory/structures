import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { join, matchesGlob, posix, resolve } from "node:path";
import { parseArgs } from "node:util";

import { checkTemplate } from "./check-template.mjs";
import { checkOwnership } from "./source-ownership.mjs";
import { expression, readRules, relativePath, templateEntries } from "./structure-rules.mjs";

const omitted = new Set([".git", "node_modules"]);

export function projectRoot(directory, explicit = false) {
  const root = realpathSync(directory);
  assert.ok(lstatSync(root).isDirectory(), "The project root must be a directory.");
  if (explicit) return root;
  try {
    return execFileSync("git", ["-C", root, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return root;
  }
}

export function inventory(root) {
  const entries = new Map();
  const directoryNames = new Map();
  function add(path) {
    if (entries.has(path)) return path;
    const parent = posix.dirname(path);
    let actualParent = "";
    if (parent !== ".") {
      actualParent = add(parent);
      if (entries.get(actualParent) !== "folder") return;
    }
    if (!directoryNames.has(actualParent))
      directoryNames.set(actualParent, readdirSync(join(root, actualParent)));
    const names = directoryNames.get(actualParent);
    const basename = posix.basename(path);
    const actualName = names.includes(basename)
      ? basename
      : names.find((name) => name.toLowerCase() === basename.toLowerCase());
    if (!actualName) return;
    path = posix.join(actualParent, actualName);
    let stat;
    try {
      stat = lstatSync(join(root, path));
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") return;
      throw error;
    }
    entries.set(
      path,
      stat.isSymbolicLink()
        ? "symlink"
        : stat.isDirectory()
          ? "folder"
          : stat.isFile()
            ? "file"
            : "special",
    );
    return path;
  }
  let files;
  try {
    files = execFileSync(
      "git",
      ["-C", root, "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
    );
  } catch (error) {
    if (error.status !== 128 && error.code !== "ENOENT") throw error;
  }
  if (files !== undefined) {
    for (const path of files.split("\0").filter(Boolean)) add(relativePath(path));
  } else {
    function walk(parent) {
      for (const item of readdirSync(join(root, parent), { withFileTypes: true })) {
        if (omitted.has(item.name)) continue;
        const path = posix.join(parent, item.name);
        add(path);
        if (entries.get(path) === "folder") walk(path);
      }
    }
    walk("");
  }
  return new Map([...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

function within(path, scope) {
  return !scope || path === scope || path.startsWith(`${scope}/`);
}

function kebab(name, kind) {
  const extension = kind === "file" ? posix.extname(name) : "";
  const stem = extension ? name.slice(0, -extension.length) : name;
  return (
    stem
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/[_\s]+/g, "-")
      .toLowerCase() + extension
  );
}

export function checkStructure(root, scope = "") {
  if (scope) relativePath(scope);
  const preferred = ".structures/config.json";
  const config = existsSync(join(root, preferred))
    ? preferred
    : ".agents/configs/.structures/config.json";
  assert.ok(
    existsSync(join(root, config)),
    `No folder template found. Initialize ${preferred} first.`,
  );
  const profile = JSON.parse(readFileSync(join(root, config), "utf8"));
  checkTemplate(profile);
  const policies = readRules(profile);
  const entries = inventory(root);
  const template = templateEntries(profile);
  const findings = [];
  const warnings = [];
  const add = (code, path, rule, message, destination) => {
    if (within(path, scope))
      findings.push({ code, path, rule, message, ...(destination ? { destination } : {}) });
  };
  const ignored = (path) =>
    policies.some(
      (policy) =>
        within(path, policy.path) &&
        (policy.ignore ?? []).some((pattern) => {
          const relative = posix.relative(policy.path || ".", path);
          const parts = relative.split("/");
          return parts.some((_, i) => matchesGlob(parts.slice(0, i + 1).join("/"), pattern));
        }),
    );
  const byLowercase = new Map();
  for (const [path, kind] of entries) {
    if (ignored(path)) continue;
    const lower = path.toLowerCase();
    if (byLowercase.has(lower))
      add("collision", path, "template", `Collides with ${byLowercase.get(lower)} ignoring case.`);
    else byLowercase.set(lower, path);
    if (kind === "symlink" && within(path, scope)) warnings.push(`Skipped symlink: ${path}`);
  }
  const renamedFolders = [];
  for (const { node, path } of template.slice(1)) {
    if (ignored(path)) continue;
    const actual = byLowercase.get(path.toLowerCase());
    if (!actual) continue;
    if (entries.get(actual) !== node.type) {
      add("type", actual, node.id, `Expected a ${node.type}.`);
    } else if (actual !== path && !renamedFolders.some((parent) => within(actual, parent))) {
      add("path-case", actual, node.id, `Expected ${path}.`, path);
      if (node.type === "folder") renamedFolders.push(actual);
    }
  }
  let ruleCount = 0;
  for (const policy of policies) {
    for (const required of policy.required ?? []) {
      const path = posix.join(policy.path, required);
      let current = root;
      const present = path.split("/").every((part) => {
        if (!lstatSync(current).isDirectory() || !readdirSync(current).includes(part)) return false;
        current = join(current, part);
        return !lstatSync(current).isSymbolicLink();
      });
      if (!present)
        add("required", path, policy.nodeId, "Required path is missing or traverses a symlink.");
    }
    for (const rule of policy.rules ?? []) {
      ruleCount++;
      for (const [path, kind] of entries) {
        if (kind !== (rule.kind ?? "file") || !within(path, policy.path) || ignored(path)) continue;
        const local = posix.relative(policy.path || ".", path);
        if (
          !matchesGlob(local, rule.match) ||
          (rule.exclude ?? []).some((pattern) => matchesGlob(local, pattern))
        )
          continue;
        const id = `${policy.nodeId}:${rule.id}`;
        const name = posix.basename(path);
        if (rule.case) {
          const expected = kebab(name, kind);
          const extension = kind === "file" ? posix.extname(expected) : "";
          const stem = extension ? expected.slice(0, -extension.length) : expected;
          if (!/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/.test(stem))
            add("case", path, id, "Name cannot be converted to kebab-case automatically.");
          else if (expected !== name)
            add(
              "case",
              path,
              id,
              `Expected ${expected}.`,
              posix.join(posix.dirname(path), expected),
            );
        }
        if (rule.name && !expression(rule.name).test(name))
          add("name", path, id, `Filename must match ${rule.name}.`);
        if (rule.path && !expression(rule.path).test(local))
          add("path", path, id, `Path must match ${rule.path} within ${policy.path || "."}.`);
        if (rule.rename && expression(rule.rename.pattern).test(local)) {
          const renamed = local.replace(expression(rule.rename.pattern), rule.rename.replacement);
          relativePath(renamed);
          const destination = posix.join(policy.path, renamed);
          if (destination !== path)
            add("rename", path, id, `Expected ${destination}.`, destination);
        }
      }
    }
  }
  const ownership = checkOwnership(root, entries, policies, ignored);
  findings.push(...ownership.findings.filter((finding) => within(finding.path, scope)));
  warnings.push(...ownership.warnings);
  for (const placement of findings.filter(
    (finding) => finding.code.startsWith("ownership") && finding.destination,
  )) {
    const renames = findings.filter(
      (finding) =>
        finding.path === placement.path &&
        !finding.code.startsWith("ownership") &&
        finding.destination &&
        posix.dirname(finding.destination) === posix.dirname(finding.path),
    );
    if (new Set(renames.map((finding) => finding.destination)).size !== 1) continue;
    placement.destination = posix.join(
      posix.dirname(placement.destination),
      posix.basename(renames[0].destination),
    );
    for (const rename of renames) rename.destination = placement.destination;
  }
  const proseOnlyScopes = template
    .filter(
      ({ node }) =>
        node.type !== "file" &&
        /module naming rules/i.test(profile.folders.documentation[node.id.toLowerCase()]) &&
        !policies.some((policy) => policy.nodeId === node.id),
    )
    .map(({ path }) => path || ".");
  if (!ruleCount)
    warnings.push(
      "No executable naming or placement rules; prose-only conventions are not checked.",
    );
  if (proseOnlyScopes.length)
    warnings.push(`Prose-only module rules need encoding: ${proseOnlyScopes.join(", ")}`);
  return { root, config, scope: scope || ".", ruleCount, findings, warnings };
}

export function cliOptions() {
  const { values } = parseArgs({
    options: {
      root: { type: "string" },
      scope: { type: "string" },
      json: { type: "boolean" },
      help: { type: "boolean" },
    },
  });
  return { ...values, root: projectRoot(resolve(values.root ?? "."), values.root !== undefined) };
}

export function printReport(report, json) {
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    for (const finding of report.findings)
      console.log(`${finding.path}: ${finding.message} [${finding.rule}]`);
    for (const warning of report.warnings) console.log(`Warning: ${warning}`);
    console.log(`${report.findings.length} violation(s); ${report.ruleCount} executable rule(s).`);
  }
}

if (import.meta.main) {
  try {
    const options = cliOptions();
    if (options.help)
      console.log(
        "Usage: node check-structure.mjs [--root <project>] [--scope <relative-path>] [--json]\nRead-only. Exit 0: no violations, 1: violations, 2: configuration/execution error.",
      );
    else {
      const report = checkStructure(options.root, options.scope);
      printReport(report, options.json);
      process.exitCode = report.findings.length ? 1 : 0;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
