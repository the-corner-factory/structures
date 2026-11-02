import type { ManifestConfig } from "material-icon-theme";
import { useMemo } from "react";

import { createMaterialIconManifest, materialIconUrl } from "#/lib/material-icons.ts";
import type { ExplorerKind, FolderStructure } from "#/lib/structures.ts";

import { flattenStructures, nodeId } from "./structures/structure-data";
import { StructureTree as SharedTree } from "./structures/structure-tree";

function sortFolders(items: FolderStructure[]): FolderStructure[] {
  return [...items]
    .sort(
      (a, b) =>
        Number(a.type === "file") - Number(b.type === "file") ||
        a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    )
    .map((item) => (item.children ? { ...item, children: sortFolders(item.children) } : item));
}

export function StructureTree({
  items,
  kind,
  manifestConfig,
  selectedElement,
  onSelect,
  forceExpand,
}: {
  items: FolderStructure[];
  kind: ExplorerKind;
  manifestConfig?: ManifestConfig;
  selectedElement?: string;
  onSelect: (element: string) => void;
  forceExpand?: boolean;
}) {
  const manifest = useMemo(() => createMaterialIconManifest(manifestConfig), [manifestConfig]);
  const orderedItems = useMemo(
    () => (kind === "folders" ? sortFolders(items) : items),
    [items, kind],
  );
  const selectedId = flattenStructures(items).find(
    (node) => nodeId(node).toLowerCase() === selectedElement?.toLowerCase(),
  );
  return (
    <SharedTree
      className="structure-tree"
      items={orderedItems}
      selectedId={selectedId ? nodeId(selectedId) : undefined}
      onSelect={(node) => onSelect(nodeId(node))}
      forceExpand={forceExpand}
      selectOnHover
      renderIcon={(item, { expanded }) =>
        kind === "issues" && item.color ? (
          <span
            className="label-color"
            style={{ color: item.color, backgroundColor: item.bgColor, borderColor: item.color }}
            aria-hidden="true"
          />
        ) : (
          <img
            src={materialIconUrl(manifest, item.name, item.type, expanded)}
            alt=""
            className="tree-kind-icon material-icon"
            aria-hidden="true"
          />
        )
      }
    />
  );
}
