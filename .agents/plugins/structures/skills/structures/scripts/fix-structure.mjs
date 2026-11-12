import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, relative, resolve, sep } from "node:path";

import { checkStructure, cliOptions, inventory, printReport } from "./check-structure.mjs";
import { relativePath } from "./structure-rules.mjs";
import { typescriptProject } from "./typescript-project.mjs";

const sourceExtension = /\.(?:[cm]?[jt]sx?)$/;
const inside = (path, parent) => path === parent || path.startsWith(`${parent}/`);

function safePath(root, path, allowCaseRename = false) {
  relativePath(path);
  assert.ok(
    !path.split("/").some((part) => [".git", "node_modules"].includes(part)),
    `Protected path: ${path}`,
  );
  let current = root;
  const parts = path.split("/");
  for (const [index, part] of parts.entries()) {
    if (!existsSync(current)) break;
    const names = readdirSync(current);
    const actual = names.find((name) => name.toLowerCase() === part.toLowerCase());
    assert.ok(
      !actual || actual === part || (allowCaseRename && index === parts.length - 1),
      `Destination has different parent casing: ${path}`,
    );
    current = join(current, actual ?? part);
    if (actual) assert.ok(!lstatSync(current).isSymbolicLink(), `Symlink path: ${path}`);
  }
}

function renameEdits(root, from, to, files) {
  const affected = [...files].filter(([path, kind]) => kind === "file" && inside(path, from));
  const edits = new Map();
  const importSpans = new Map();
  let service;
  if (affected.some(([path]) => sourceExtension.test(path))) {
    const { ts, parsed } = typescriptProject(root);
    const host = {
      ...ts.sys,
      useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
      getScriptFileNames: () => parsed.fileNames,
      getScriptVersion: () => "0",
      getScriptSnapshot: (file) => {
        const text = ts.sys.readFile(file);
        return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
      },
      getCurrentDirectory: () => root,
      getCompilationSettings: () => parsed.options,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    };
    service = ts.createLanguageService(host);
    try {
      const program = service.getProgram();
      for (const [path] of affected.filter(([path]) => sourceExtension.test(path))) {
        assert.ok(
          program.getSourceFile(join(root, path)),
          `Source is outside this tsconfig: ${path}`,
        );
      }
      for (const source of program.getSourceFiles()) {
        if (
          !source.fileName.startsWith(`${root}${sep}`) ||
          source.fileName.includes(`${sep}node_modules${sep}`)
        )
          continue;
        const spans = [];
        function visit(node) {
          let specifier;
          if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
            specifier = node.moduleSpecifier;
          if (
            ts.isImportEqualsDeclaration(node) &&
            ts.isExternalModuleReference(node.moduleReference)
          )
            specifier = node.moduleReference.expression;
          if (ts.isCallExpression(node)) {
            const target = node.expression.getText(source);
            if (target === "import" || target === "require") {
              assert.ok(
                node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0]),
                `Computed module reference needs manual migration: ${relative(root, source.fileName)}`,
              );
              specifier = node.arguments[0];
            }
            assert.ok(
              target !== "import.meta.glob" && target !== "require.context",
              `Glob-based discovery needs manual migration: ${relative(root, source.fileName)}`,
            );
          }
          if (
            specifier &&
            ts.isStringLiteralLike(specifier) &&
            ts.resolveModuleName(specifier.text, source.fileName, parsed.options, ts.sys)
              .resolvedModule
          ) {
            spans.push({ start: specifier.getStart(source), length: specifier.getWidth(source) });
          }
          ts.forEachChild(node, visit);
        }
        visit(source);
        importSpans.set(source.fileName, spans);
      }
      for (const change of service.getEditsForFileRename(
        join(root, from),
        join(root, to),
        {},
        {},
      )) {
        assert.ok(!change.isNewFile, "Creating reference files needs manual migration.");
        const path = relative(root, change.fileName).split(sep).join("/");
        safePath(root, path);
        edits.set(path, change.textChanges);
      }
    } finally {
      service.dispose();
    }
  }
  const tokens = new Set([from, posix.basename(from)]);
  const stems = new Set();
  for (const [path] of affected) {
    tokens.add(path);
    tokens.add(posix.basename(path));
    if (sourceExtension.test(path)) {
      stems.add(path.replace(sourceExtension, ""));
      stems.add(posix.basename(path).replace(sourceExtension, ""));
    }
  }
  const escaped = (values) =>
    [...values]
      .sort((a, b) => b.length - a.length)
      .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
  const reference = new RegExp(
    `(?:^|[\\s\"'\x60/(])(?:${escaped(tokens)})(?=$|[\\s\"'\x60/?.#),;])`,
    "m",
  );
  const moduleReference = stems.size
    ? new RegExp(`[\"'\x60/](?:${escaped(stems)})(?=$|[\"'\x60/?.#])`, "m")
    : null;
  for (const [path, kind] of files) {
    if (
      kind !== "file" ||
      path === ".agents/configs/.structures/config.json" ||
      path === ".structures/config.json"
    )
      continue;
    const content = readFileSync(join(root, path));
    if (content.includes(0)) continue;
    let remaining = content.toString("utf8");
    const spans = [
      ...(importSpans.get(join(root, path)) ?? []),
      ...(edits.get(path) ?? []).map((edit) => edit.span),
    ];
    // Mask recognized references; remaining path mentions need a format-specific migration.
    const characters = remaining.split("");
    for (const span of spans) characters.fill(" ", span.start, span.start + span.length);
    remaining = characters.join("");
    assert.ok(
      !reference.test(remaining) && !moduleReference?.test(remaining),
      `Unmanaged reference to ${from} in ${path}; no files changed.`,
    );
  }
  return edits;
}

export function fixStructure(root, scope = "") {
  const before = checkStructure(root, scope);
  const plan = new Map();
  for (const finding of before.findings) {
    if (!finding.destination) continue;
    assert.ok(
      !plan.has(finding.path) || plan.get(finding.path) === finding.destination,
      `Conflicting fixes for ${finding.path}. Update the rules first.`,
    );
    plan.set(finding.path, finding.destination);
  }
  const files = inventory(root);
  const staged = (() => {
    try {
      return execFileSync(
        "git",
        ["-C", root, "diff", "--cached", "--name-only", "--relative", "-z", "--", "."],
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        },
      )
        .split("\0")
        .filter(Boolean)
        .map((path) => path.toLowerCase());
    } catch (error) {
      if (error.status === 129 || error.status === 128 || error.code === "ENOENT") return [];
      throw error;
    }
  })();
  for (const [from, to] of plan) {
    safePath(root, from);
    safePath(root, to, from.toLowerCase() === to.toLowerCase());
    assert.ok(!scope || inside(to, scope), `Destination leaves --scope: ${to}`);
    assert.ok(!inside(to, from), `Cannot move a path into itself: ${from}`);
    for (const config of [
      before.config,
      ".agents/configs/.structures/config.json",
      ".structures/config.json",
    ]) {
      assert.ok(!inside(config, from) && !inside(config, to), "Fixes must preserve the template.");
    }
    for (const [otherFrom, otherTo] of plan) {
      if (from === otherFrom) continue;
      assert.ok(
        !inside(from, otherFrom) && !inside(otherFrom, from),
        "Overlapping moves need separate fix runs.",
      );
      assert.ok(
        to.toLowerCase() !== otherTo.toLowerCase() && !inside(to, otherFrom),
        "Fix destinations collide.",
      );
    }
    assert.ok(
      !staged.some((path) => inside(path, from.toLowerCase()) || inside(path, to.toLowerCase())),
      `Staged path would move: ${from}`,
    );
    const collision = [...files.keys()].find(
      (path) => path.toLowerCase() === to.toLowerCase() && path !== from,
    );
    assert.ok(!collision, `Destination already exists: ${to}`);
    assert.ok(
      !existsSync(join(root, to)) || from.toLowerCase() === to.toLowerCase(),
      `Destination already exists: ${to}`,
    );
    if (files.get(from) === "folder") {
      const actual = readdirSync(join(root, from), { recursive: true, withFileTypes: true });
      assert.ok(
        actual.every((entry) => !entry.isSymbolicLink()),
        `Directory contains symlinks: ${from}`,
      );
      for (const entry of actual.filter((entry) => entry.isFile())) {
        const path = relative(root, join(entry.parentPath, entry.name)).split(sep).join("/");
        assert.ok(
          files.has(path),
          `Directory contains ignored or untracked hidden contents: ${path}`,
        );
      }
    }
  }
  const undo = [];
  const applied = [];
  try {
    for (const [from, to] of plan) {
      const edits = renameEdits(root, from, to, inventory(root));
      for (const [path, changes] of edits) {
        assert.ok(
          !staged.includes(path.toLowerCase()),
          `Reference edits would change a staged file: ${path}`,
        );
        const filename = join(root, path);
        const original = readFileSync(filename, "utf8");
        let updated = original;
        let end = original.length;
        for (const { span, newText } of [...changes].sort((a, b) => b.span.start - a.span.start)) {
          assert.ok(span.start + span.length <= end, `Overlapping reference edits: ${path}`);
          updated =
            updated.slice(0, span.start) + newText + updated.slice(span.start + span.length);
          end = span.start;
        }
        undo.push(() => writeFileSync(filename, original));
        writeFileSync(filename, updated);
      }
      const missing = [];
      let parent = dirname(join(root, to));
      while (!existsSync(parent)) {
        missing.push(parent);
        parent = dirname(parent);
      }
      for (const directory of missing.reverse()) {
        mkdirSync(directory);
        undo.push(() => rmdirSync(directory));
      }
      const oldPath = join(root, from);
      const newPath = join(root, to);
      // A unique intermediate name makes case-only renames work on case-insensitive filesystems.
      if (from.toLowerCase() === to.toLowerCase()) {
        const temporary = `${oldPath}.structures-${process.pid}-${Date.now()}`;
        assert.ok(!existsSync(temporary), "Temporary rename path already exists.");
        renameSync(oldPath, temporary);
        try {
          renameSync(temporary, newPath);
        } catch (error) {
          renameSync(temporary, oldPath);
          throw error;
        }
      } else renameSync(oldPath, newPath);
      undo.push(() => renameSync(newPath, oldPath));
      applied.push({ from, to });
    }
    return { ...checkStructure(root, scope), applied };
  } catch (error) {
    const failures = [];
    for (const restore of undo.reverse())
      try {
        restore();
      } catch (failure) {
        failures.push(failure.message);
      }
    if (failures.length)
      throw new Error(`${error.message}\nRollback incomplete: ${failures.join("; ")}`);
    throw error;
  }
}

if (import.meta.main) {
  try {
    const options = cliOptions();
    if (options.help)
      console.log(
        "Usage: node fix-structure.mjs [--root <project>] [--scope <relative-directory>] [--json]\nApplies checker mappings, updates supported TypeScript references, and checks again. Exit 0: clean, 1: violations remain, 2: blocked/error (rolled back).",
      );
    else {
      const report = fixStructure(resolve(options.root), options.scope);
      if (!options.json) for (const { from, to } of report.applied) console.log(`${from} -> ${to}`);
      printReport(report, options.json);
      process.exitCode = report.findings.length ? 1 : 0;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
