import { matchesGlob, posix, relative, sep } from "node:path";

import { typescriptProject } from "./typescript-project.mjs";

const sourceFile = /\.[cm]?[jt]sx?$/;
const companion = /(?:\.(?:test|spec)\.[cm]?[jt]sx?|\.d\.[cm]?ts)$/;
const inside = (path, parent) => !parent || path === parent || path.startsWith(`${parent}/`);

export function checkOwnership(root, entries, policies, ignored) {
  const configured = policies.flatMap((policy) =>
    (policy.rules ?? []).filter((rule) => rule.ownership).map((rule) => ({ policy, rule })),
  );
  if (!configured.length) return { findings: [], warnings: [] };
  const analysisRoots = configured.flatMap(({ policy, rule }) => {
    const core = posix.join(policy.path, rule.ownership.core).split("/");
    const shared = posix.join(policy.path, rule.ownership.shared).split("/");
    const parent = core
      .slice(
        0,
        core.join("/") === shared.join("/")
          ? core.length - 1
          : core.findIndex((part, index) => part !== shared[index]),
      )
      .join("/");
    const owners = [...entries]
      .filter(
        ([path, kind]) =>
          kind === "folder" &&
          inside(path, policy.path) &&
          rule.ownership.owners.some((pattern) =>
            matchesGlob(posix.relative(policy.path || ".", path), pattern),
          ),
      )
      .map(([path]) => path);
    return [parent, ...owners];
  });
  const { ts, parsed } = typescriptProject(root);
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const checker = program.getTypeChecker();
  const localPath = (file) => relative(root, file).split(sep).join("/");
  const sources = new Map(
    program
      .getSourceFiles()
      .filter(
        (source) => !source.isDeclarationFile && entries.get(localPath(source.fileName)) === "file",
      )
      .map((source) => [localPath(source.fileName), source]),
  );
  const consumers = new Map();
  const instances = new Map();
  const rootProviders = new Set();
  const injectables = new Set();
  const classes = new Set();
  const blockers = new Set();
  const addInstance = (target, path, node, kind) => {
    const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line + 1;
    if (!instances.has(target)) instances.set(target, []);
    instances.get(target).push({ path, line, kind });
  };
  function symbolAt(node) {
    let symbol = checker.getSymbolAtLocation(node);
    if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    return symbol;
  }
  function targets(node) {
    return new Set(
      (symbolAt(node)?.declarations ?? [])
        .map((declaration) => localPath(declaration.getSourceFile().fileName))
        .filter((path) => sources.has(path)),
    );
  }
  function topLevelInitializer(node) {
    while (
      ts.isParenthesizedExpression(node.parent) ||
      ts.isAsExpression(node.parent) ||
      ts.isTypeAssertionExpression(node.parent) ||
      ts.isSatisfiesExpression(node.parent) ||
      ts.isNonNullExpression(node.parent)
    )
      node = node.parent;
    if (
      ts.isPropertyDeclaration(node.parent) &&
      node.parent.initializer === node &&
      node.parent.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) &&
      ts.isClassDeclaration(node.parent.parent) &&
      ts.isSourceFile(node.parent.parent.parent)
    )
      return true;
    return (
      ts.isVariableDeclaration(node.parent) &&
      node.parent.initializer === node &&
      ts.isVariableDeclarationList(node.parent.parent) &&
      ts.isVariableStatement(node.parent.parent.parent) &&
      ts.isSourceFile(node.parent.parent.parent.parent)
    );
  }
  for (const [path, kind] of entries) {
    if (!analysisRoots.some((scope) => inside(path, scope))) continue;
    if (kind === "file" && sourceFile.test(path) && !companion.test(path) && !sources.has(path))
      blockers.add(`Source outside tsconfig: ${path}`);
    if (kind === "file" && /\.(?:vue|svelte)$/.test(path))
      blockers.add(`Framework source needs ownership review: ${path}`);
    if (kind === "symlink") blockers.add(`Symlink source needs ownership review: ${path}`);
  }
  for (const [path, source] of sources) {
    if (companion.test(path)) continue;
    if (source.parseDiagnostics.length) blockers.add(`Invalid source syntax: ${path}`);
    const angular = new Map();
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== "@angular/core")
        continue;
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings))
        for (const item of bindings.elements)
          angular.set(item.name.text, (item.propertyName ?? item.name).text);
      if (bindings && ts.isNamespaceImport(bindings)) angular.set(bindings.name.text, "*");
    }
    function injectableDecorator(node) {
      if (!ts.isCallExpression(node)) return false;
      const expression = node.expression;
      return (
        (ts.isIdentifier(expression) && angular.get(expression.text) === "Injectable") ||
        (ts.isPropertyAccessExpression(expression) &&
          angular.get(expression.expression.getText(source)) === "*" &&
          expression.name.text === "Injectable")
      );
    }
    function visit(node) {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        const specifier = node.moduleSpecifier;
        if (specifier && ts.isStringLiteralLike(specifier)) {
          const resolved = ts.resolveModuleName(
            specifier.text,
            source.fileName,
            parsed.options,
            ts.sys,
          ).resolvedModule;
          if (
            !resolved &&
            (specifier.text.startsWith(".") ||
              specifier.text.startsWith("#") ||
              Object.keys(parsed.options.paths ?? {}).some((alias) =>
                matchesGlob(specifier.text, alias),
              ))
          )
            blockers.add(`Unresolved local import in ${path}: ${specifier.text}`);
          if (
            ts.isImportDeclaration(node) &&
            !node.importClause &&
            resolved &&
            sources.has(localPath(resolved.resolvedFileName))
          )
            blockers.add(`Side-effect import needs ownership review: ${path}`);
        }
        return;
      }
      if (ts.isImportEqualsDeclaration(node))
        blockers.add(`Import assignment needs ownership review: ${path}`);
      if (ts.isCallExpression(node)) {
        const name = node.expression.getText(source);
        if (["import", "require", "import.meta.glob", "require.context"].includes(name))
          blockers.add(`Dynamic module discovery needs ownership review: ${path}`);
      }
      if (ts.isClassDeclaration(node)) {
        classes.add(path);
        for (const decorator of ts.getDecorators(node) ?? []) {
          if (!injectableDecorator(decorator.expression)) continue;
          injectables.add(path);
          const options = decorator.expression.arguments[0];
          if (!options) continue;
          if (!ts.isObjectLiteralExpression(options)) {
            blockers.add(`Computed provider scope: ${path}`);
            continue;
          }
          for (const property of options.properties) {
            if (
              ts.isSpreadAssignment(property) ||
              (property.name && ts.isComputedPropertyName(property.name))
            )
              blockers.add(`Computed provider scope: ${path}`);
            if (
              !ts.isPropertyAssignment(property) ||
              property.name.getText(source).replace(/["']/g, "") !== "providedIn"
            )
              continue;
            if (
              ts.isStringLiteralLike(property.initializer) &&
              ["root", "platform"].includes(property.initializer.text)
            ) {
              rootProviders.add(path);
              addInstance(path, path, property, "root-provider");
            } else if (property.initializer.kind !== ts.SyntaxKind.NullKeyword)
              blockers.add(`Nonlocal or computed provider scope: ${path}`);
          }
        }
      }
      if (
        ts.isNewExpression(node) ||
        ts.isCallExpression(node) ||
        ts.isObjectLiteralExpression(node) ||
        ts.isArrayLiteralExpression(node)
      ) {
        if (topLevelInitializer(node)) {
          addInstance(path, path, node, "module-initializer");
          if (ts.isNewExpression(node))
            for (const target of targets(node.expression))
              if (target !== path) addInstance(target, path, node, "module-initializer");
        } else if (ts.isNewExpression(node)) {
          for (const target of targets(node.expression))
            addInstance(target, path, node, "local-construction");
        }
      }
      if (ts.isIdentifier(node)) {
        for (const target of targets(node)) {
          if (target === path) continue;
          if (!consumers.has(target)) consumers.set(target, new Set());
          consumers.get(target).add(path);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  const findings = [];
  for (const { policy, rule } of configured) {
    const core = posix.join(policy.path, rule.ownership.core);
    const shared = posix.join(policy.path, rule.ownership.shared);
    const ownerFolders = [...entries]
      .filter(
        ([path, kind]) =>
          kind === "folder" &&
          inside(path, policy.path) &&
          rule.ownership.owners.some((pattern) =>
            matchesGlob(posix.relative(policy.path || ".", path), pattern),
          ),
      )
      .map(([path]) => path);
    if (ownerFolders.some((path) => inside(core, path) || inside(shared, path)))
      throw new Error(
        `Ownership child folders cannot contain core or shared: ${policy.nodeId}:${rule.id}`,
      );
    const ownerOf = (path) =>
      ownerFolders.filter((owner) => inside(path, owner)).sort((a, b) => b.length - a.length)[0];
    const matches = (path) =>
      inside(path, policy.path) &&
      !ignored(path) &&
      matchesGlob(posix.relative(policy.path || ".", path), rule.match) &&
      !(rule.exclude ?? []).some((pattern) =>
        matchesGlob(posix.relative(policy.path || ".", path), pattern),
      );
    for (const [path, kind] of entries) {
      if (kind !== "file" || !sourceFile.test(path) || companion.test(path) || !matches(path))
        continue;
      const usage = new Set();
      const visited = new Set([path]);
      function trace(target) {
        for (const consumer of consumers.get(target) ?? []) {
          if (visited.has(consumer)) continue;
          visited.add(consumer);
          if (!ownerOf(consumer) && (inside(consumer, core) || inside(consumer, shared)))
            trace(consumer);
          else usage.add(consumer);
        }
      }
      trace(path);
      const uses = [...usage].sort();
      const ownership = ownerFolders
        .filter((owner) => uses.length && uses.every((use) => inside(use, owner)))
        .sort((a, b) => b.length - a.length)[0];
      const construction = instances.get(path) ?? [];
      const moduleSymbol = sources.has(path)
        ? checker.getSymbolAtLocation(sources.get(path))
        : undefined;
      const moduleInstances = construction.filter((item) => item.kind === "module-initializer");
      const singleton =
        rootProviders.has(path) ||
        moduleInstances.some((item) => item.path === path) ||
        (moduleInstances.length === 1 &&
          !construction.some((item) => item.kind === "local-construction"));
      const target = ownership ?? (singleton ? core : shared);
      const evidence = { consumers: uses, instantiations: construction };
      const stem = path.replace(sourceFile, "");
      const companions = [...entries.keys()].filter(
        (file) =>
          file.startsWith(`${stem}.`) &&
          /^\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file.slice(stem.length)),
      );
      let reason;
      if (!sources.has(path) || blockers.size)
        reason = "Source coverage is incomplete; resolve ownership warnings before moving files.";
      else if (!moduleSymbol) reason = "Global script declarations need ownership review.";
      else if (!uses.length)
        reason = "No production consumers were resolved; ownership needs review.";
      else if (!ownerFolders.length)
        reason = "No configured child folders exist; verify the ownership boundaries.";
      else if (uses.some((use) => !inside(use, policy.path)))
        reason = "Consumers outside this policy scope need ownership review.";
      else if (ownership && rootProviders.has(path))
        reason = `Only ${ownership} consumes this module, but it has an application-wide provider. Review its provider lifetime and registration before moving it.`;
      else if (
        ownership &&
        (construction.some((item) => item.path !== path && !inside(item.path, ownership)) ||
          [...visited].some((consumer) => consumer !== path && rootProviders.has(consumer)))
      )
        reason = `Construction or an application-wide provider lies outside ${ownership}; review the instance's owner before moving its definition.`;
      else if (!ownership && injectables.has(path) && !singleton)
        reason =
          "Consumers cross child scopes, but the injectable's provider lifetime is not established.";
      else if (!ownership && classes.has(path) && !construction.length)
        reason =
          "The class's construction lifetime is not resolved; review its registration or factory before moving it.";
      else if (
        !ownership &&
        singleton &&
        construction.some((item) => item.kind === "local-construction")
      )
        reason =
          "Both module-level and local construction exist; split or review their lifetimes before moving this module.";
      else if (!ownership && singleton && checker.getExportsOfModule(moduleSymbol).length > 1)
        reason =
          "This module mixes exports with an instance lifetime; review or split their ownership before moving it.";
      else if (
        !ownership &&
        singleton &&
        construction.some(
          (item) => item.kind === "module-initializer" && item.path !== path && ownerOf(item.path),
        )
      )
        reason =
          "Construction is owned by a child folder but consumers cross scopes; review where the instance is created.";
      else if (
        !inside(path, target) &&
        companions.some((file) => ignored(file) || entries.get(file) !== "file")
      )
        reason = "An excluded or symlinked companion test needs review before moving its owner.";
      else if (
        !inside(path, target) &&
        [...entries.keys()].some(
          (file) => file.startsWith(`${stem}.`) && /\.(?:html|css|scss|sass|less|json)$/.test(file),
        )
      )
        reason = "Companion resources need a framework-aware move with their owner.";
      const destination = posix.join(target, posix.basename(path));
      if (reason) {
        findings.push({
          code: "ownership-review",
          path,
          rule: `${policy.nodeId}:${rule.id}`,
          message: reason,
          evidence,
          ...(!inside(path, target) ? { suggestedDestination: destination } : {}),
        });
      } else if (
        !inside(path, target) ||
        ((target === core || target === shared) && ownerOf(path))
      ) {
        findings.push({
          code: "ownership",
          path,
          rule: `${policy.nodeId}:${rule.id}`,
          message: `Expected ${target}/: ${ownership ? "instantiation and use belong to one child scope" : singleton ? "application-wide instance" : "reused across child scopes"}.`,
          destination,
          evidence,
        });
        for (const file of companions)
          findings.push({
            code: "ownership-companion",
            path: file,
            rule: `${policy.nodeId}:${rule.id}`,
            message: `Keep the test beside ${destination}.`,
            destination: posix.join(target, posix.basename(file)),
          });
      }
    }
  }
  return { findings, warnings: [...blockers].sort() };
}
