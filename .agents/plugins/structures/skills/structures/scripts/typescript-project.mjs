import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

export function typescriptProject(root) {
  let ts;
  try {
    ts = createRequire(join(root, "package.json"))("typescript");
  } catch {
    throw new Error("Source analysis and renames need TypeScript installed in the target project.");
  }
  const configFile = ts.findConfigFile(root, ts.sys.fileExists);
  assert.ok(
    configFile && dirname(configFile) === root,
    "Source analysis and renames need a tsconfig.json at the project root.",
  );
  const loaded = ts.readConfigFile(configFile, ts.sys.readFile);
  assert.ok(!loaded.error, "Cannot read tsconfig.json.");
  const parsed = ts.parseJsonConfigFileContent(loaded.config, ts.sys, root);
  assert.ok(
    !parsed.errors.length,
    ts.formatDiagnosticsWithColorAndContext(parsed.errors, {
      getCurrentDirectory: () => root,
      getCanonicalFileName: (name) => name,
      getNewLine: () => "\n",
    }),
  );
  assert.ok(
    !parsed.projectReferences?.length,
    "Project references need a project-aware migration; no files changed.",
  );
  return { ts, parsed };
}
